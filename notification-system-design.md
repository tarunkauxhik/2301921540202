# Notification System Design

A design and implementation reference for the notification platform. Users receive
real-time updates about company announcements, internal events, and operational
results. Every service in the platform reports its activity through a shared
logging middleware, and all routes are treated as pre-authorized.

---

## Stage 1

### Goal

Design the REST API, contract, and structure used to display notifications to
users, identify the core actions the platform supports, and define a mechanism
for real-time delivery.

### Core actions

| Action | Why it exists |
|--------|---------------|
| List notifications | Show a user their notifications with paging and type filters |
| Get a single notification | Open one notification in detail |
| Create a notification | A producer (event, result, announcement) raises a notification |
| Mark one as read | Track which notifications a user has seen |
| Mark all as read | Clear the unread badge in one step |
| Priority inbox | Surface the most important unread notifications |
| Real-time stream | Push new notifications to a connected client instantly |

### Conventions

- Base path: `/api/v1`.
- Plural, noun based resources (`/notifications`).
- Standard verbs: `GET` to read, `POST` to create, `PATCH` to update state.
- Standard status codes: `200`, `201`, `400`, `401`, `404`, `500`.
- Timestamps are ISO 8601 in UTC.

### Endpoints

#### List notifications

```
GET /api/v1/notifications?limit=10&page=1&notification_type=Event&status=unread
```

Request headers:

```
Authorization: Bearer <token>
Accept: application/json
```

Response `200`:

```json
{
  "page": 1,
  "limit": 10,
  "total": 240,
  "notifications": [
    {
      "id": "6ed625c9-e1b5-462c-913a-8e89c81dec27",
      "type": "Event",
      "message": "induction",
      "isRead": false,
      "createdAt": "2026-06-25T08:24:52Z"
    }
  ]
}
```

#### Get a single notification

```
GET /api/v1/notifications/{id}
```

Response `200`:

```json
{
  "id": "6ed625c9-e1b5-462c-913a-8e89c81dec27",
  "type": "Event",
  "message": "induction",
  "isRead": false,
  "createdAt": "2026-06-25T08:24:52Z"
}
```

#### Create a notification

```
POST /api/v1/notifications
```

Request body:

```json
{
  "userId": 1042,
  "type": "Result",
  "message": "Semester result published"
}
```

Response `201`:

```json
{
  "id": "b9f1d2a0-1c44-4a8e-9b21-77d0c0a1f234",
  "type": "Result",
  "message": "Semester result published",
  "isRead": false,
  "createdAt": "2026-06-26T05:41:13Z"
}
```

#### Mark one as read

```
PATCH /api/v1/notifications/{id}/read
```

Response `200`:

```json
{ "id": "b9f1d2a0-1c44-4a8e-9b21-77d0c0a1f234", "isRead": true }
```

#### Mark all as read

```
PATCH /api/v1/notifications/read-all
```

Response `200`:

```json
{ "updated": 18 }
```

#### Priority inbox

```
GET /api/v1/notifications/priority?n=10
```

Response `200`:

```json
{
  "n": 10,
  "notifications": [
    {
      "id": "…",
      "type": "Result",
      "message": "external",
      "createdAt": "2026-06-26T05:41:13Z",
      "score": 5.94
    }
  ]
}
```

### Field schema

| Field | Type | Notes |
|-------|------|-------|
| id | string (UUID) | Primary identifier |
| userId | integer | Owner of the notification |
| type | string | `Event`, `Result`, `General`, `Placement` |
| message | string | Display text |
| isRead | boolean | Read state per user |
| createdAt | string (ISO 8601) | Creation time |

### Real-time mechanism

A connected client should not poll the database on a timer. Two practical options:

1. **Server-Sent Events (SSE)** - the browser opens `GET /api/v1/notifications/stream`
   and keeps the connection open. The server pushes each new notification as an
   event. SSE is one directional (server to client), which is exactly what a
   notification feed needs, and it reconnects automatically.
2. **WebSocket** - a full duplex channel for cases that also need client to server
   messages (typing indicators, acknowledgements).

For this platform SSE is the lighter, sufficient choice. The flow:

```
Producer -> POST /notifications -> persist -> publish to a message channel
        -> SSE handler receives the event -> writes it to the open client stream
```

A pub/sub layer (Redis pub/sub or a broker) lets multiple backend instances all
deliver the same event, so horizontal scaling does not break real-time delivery.

---

## Stage 2

### Database choice

**PostgreSQL** (relational) is the primary store.

Reasons:

- Notifications are structured and uniform (the same fields every time), which
  fits a relational table well.
- The hot query is "unread notifications for one user, newest first" - a textbook
  indexed range scan that relational engines do efficiently.
- Strong consistency matters: a notification should not be lost or duplicated.
- Postgres offers partial indexes and table partitioning, both of which directly
  help the scaling problems described in Stage 3.

A document store (MongoDB) would also work, but the access pattern is highly
relational and benefits from Postgres indexing and partial indexes.

### Schema

```sql
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email       TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     BIGINT NOT NULL REFERENCES users(id),
    type        TEXT NOT NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread
    ON notifications (user_id, created_at)
    WHERE is_read = false;

CREATE INDEX idx_notifications_type_created
    ON notifications (type, created_at);
```

### Queries mapped to the APIs

List unread, newest first (paged):

```sql
SELECT id, type, message, is_read, created_at
FROM notifications
WHERE user_id = $1 AND is_read = false
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

Create:

```sql
INSERT INTO notifications (user_id, type, message)
VALUES ($1, $2, $3)
RETURNING id, type, message, is_read, created_at;
```

Mark one as read:

```sql
UPDATE notifications
SET is_read = true
WHERE id = $1
RETURNING id, is_read;
```

Mark all as read for a user:

```sql
UPDATE notifications
SET is_read = true
WHERE user_id = $1 AND is_read = false;
```

### Scaling challenges and responses

| Challenge as volume grows | Response |
|---------------------------|----------|
| Table grows to tens of millions of rows | Partition by `created_at` (monthly range partitions) so queries touch recent partitions only |
| Unread query slows down | Partial index on `(user_id, created_at) WHERE is_read = false` keeps the unread set small and ordered |
| Old data is rarely read | Archive partitions older than a retention window to cold storage |
| Write spikes during "Notify All" | Batch inserts and a write queue (see Stage 5) |
| Read load on every page load | Cache the unread list and count (see Stage 4) |

---

## Stage 3

### The slow query

```sql
SELECT * FROM notifications
WHERE userID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

### Performance analysis

With 5,000,000 rows and no useful index:

- The planner runs a **sequential scan**, reading every row to find the ones with
  `userID = 1042 AND isRead = false`.
- It then performs an **in-memory (or on-disk) sort** on `createdAt`.
- `SELECT *` returns every column, including large `message` text, which adds I/O.

So the cost is roughly **O(N)** to scan all 5M rows plus **O(M log M)** to sort the
matches. On 5M rows this is hundreds of milliseconds to seconds depending on
hardware and cache state.

### Proposed improvements

1. **Add a composite partial index** that matches the filter and the sort order:

   ```sql
   CREATE INDEX idx_notifications_user_unread
       ON notifications (userID, createdAt)
       WHERE isRead = false;
   ```

   The query becomes an **index range scan**: jump straight to `userID = 1042`,
   read only the unread rows, already ordered by `createdAt`, so the sort step is
   eliminated.

2. **Select only needed columns** instead of `SELECT *`:

   ```sql
   SELECT id, type, message, created_at
   FROM notifications
   WHERE userID = 1042 AND isRead = false
   ORDER BY createdAt ASC
   LIMIT 20;
   ```

3. **Always paginate** with `LIMIT`/`OFFSET` (or keyset pagination) so the client
   never pulls the full unread history at once.

### Estimated computation cost

- Before: scan 5,000,000 rows + sort the matches. Cost grows with the whole table.
- After: with the partial index, the engine reads only the matching unread rows
  for that user (say a few hundred), in index order. Cost drops to roughly
  **O(log N + K)** where K is the number of rows returned. In practice this turns a
  multi hundred millisecond scan into a single digit millisecond lookup.

### Evaluating "add an index to every column"

This is a poor strategy:

- **Writes get slower.** Every `INSERT`/`UPDATE` has to update every index. During
  a "Notify All" burst this multiplies the write cost.
- **Storage grows.** Each index is a separate B-tree; indexing every column can
  use more space than the table itself.
- **Most indexes are never used.** The planner picks one or two indexes per query;
  single column indexes on `message` or `is_read` alone bring little value here.
- **Composite order matters.** What this query needs is one well chosen composite
  partial index on `(userID, createdAt) WHERE isRead = false`, not many single
  column indexes.

Index deliberately, based on the real query patterns, not blindly.

### Users who received a given update type in the last 7 days

```sql
SELECT DISTINCT user_id
FROM notifications
WHERE type = 'Event'
  AND created_at >= now() - INTERVAL '7 days';
```

Supporting index:

```sql
CREATE INDEX idx_notifications_type_created
    ON notifications (type, created_at);
```

---

## Stage 4

### Problem

Notifications are fetched from the database on **every page load**, which strains
the database with repeated, identical reads.

### Strategies and trade-offs

**1. Server side cache (Redis) for the unread list and count**

Cache `unread:{userId}` (list) and `unread_count:{userId}` (number). Serve reads
from Redis; invalidate the keys when a notification is created or marked read.

- Pros: huge reduction in database reads, very fast responses, scales well.
- Cons: extra moving part to run; risk of stale data if invalidation is missed;
  needs a sensible TTL as a safety net.

**2. Real-time push instead of fetch on load**

Keep an SSE/WebSocket connection open and push new notifications. The client keeps
its list in memory and only does a full fetch on first load.

- Pros: removes repeated polling entirely; instant updates.
- Cons: needs connection management and a pub/sub layer for multiple servers.

**3. HTTP caching with ETag / conditional requests**

Return an `ETag`; the client sends `If-None-Match` and gets `304 Not Modified`
when nothing changed.

- Pros: simple, standards based, no extra infrastructure.
- Cons: still a round trip per load; only saves payload, not the request.

**4. Client side cache (in memory / localStorage)**

Cache the last result on the client and show it immediately while revalidating in
the background (stale-while-revalidate).

- Pros: instant perceived load; fewer requests.
- Cons: can show stale data briefly; per device only.

### Recommendation

Combine **(2) real-time push** as the primary mechanism with **(1) a Redis cache**
backing the first load and the unread count. Use **(4)** on the client for instant
paint. This removes the per page load database hit while keeping data fresh.

---

## Stage 5

### Current pseudocode

```
function notify_all(user_ids: array, message: string):
    for user_id in user_ids:
        send_email(user_id, message)   # calls Email API
        save_to_db(user_id, message)   # DB insert
        push_to_app(user_id, message)  # real-time notification
```

### Limitations

- **Synchronous and sequential.** 50,000 users are processed one at a time; the
  whole request blocks for a long time and likely times out.
- **No failure isolation.** If `send_email` throws for one user, the loop can stop
  and the remaining users get nothing.
- **Tight coupling.** A slow or failing Email API blocks the database write and the
  in-app push, even though those do not depend on email.
- **No retries.** A transient email failure is lost permanently.
- **No batching.** 50,000 individual DB inserts and 50,000 separate API calls are
  far more expensive than batched work.

### Handling email failures for a subset of users

Email delivery should be a **queued job per user** with **retry and backoff**, and
failures should land in a **dead letter queue** for inspection. A failure for one
user never affects the others, and a transient failure is retried instead of lost.

### Redesigned process

```
function notify_all(user_ids, message):
    notification_id = create_campaign(message)

    for batch in chunk(user_ids, 1000):
        rows = build_rows(batch, notification_id, message)
        bulk_insert(rows)                      # one batched DB write per chunk
        publish_realtime(batch, message)       # fan out in-app push

    enqueue_email_jobs(user_ids, notification_id, message)

function email_worker(job):
    try:
        send_email(job.user_id, job.message)
        mark_email_sent(job.user_id, job.notification_id)
    except RetryableError:
        if job.attempts < MAX_ATTEMPTS:
            requeue_with_backoff(job)
        else:
            send_to_dead_letter(job)
```

Key points:

- The database write is **batched** (chunks of ~1000) instead of one row at a time.
- Email is **offloaded to a queue** and processed by workers in parallel, with
  retry, backoff, and a dead letter queue.
- The in-app push is fanned out independently of email.
- The API call returns quickly after enqueuing; delivery happens in the background.

### Should the DB update and email dispatch be coupled?

**No.** They have different reliability and latency profiles:

- The database write is the **source of truth** and must succeed; the in-app
  notification depends on it.
- Email is a **best effort external side effect** that can be slow, rate limited,
  or temporarily down.

Persist first, then dispatch email asynchronously from the persisted record. If
email fails, the notification still exists in the app and the email job can retry
without touching the database write. Coupling them would let a flaky Email API
block or roll back the core write.

---

## Stage 6

### Goal

A "Priority Inbox" that returns the top `n` most important unread notifications.
Priority is a combination of a **type weight** and **recency**.

### Approach

Each notification is scored:

```
score = typeWeight(type) + recencyScore(createdAt)
```

- **Type weight** ranks categories: `Result` 5, `Placement` 4, `Event` 3,
  `General` 2, anything else 1.
- **Recency score** uses exponential decay with a 12 hour half life, so a newer
  notification scores higher and recency breaks ties between equal types.

The implementation lives in the backend service:

- `notification-app-be/src/services/priority.ts` - scoring and top `n` selection.
- `notification-app-be/src/services/notifications.ts` - pulls notifications from
  the reference API across pages (the API caps `limit` at 10 per page).
- `notification-app-be/src/controllers/notifications.ts` - exposes
  `GET /api/notifications/priority?n=10`.

Reference API used as the source:

```
GET http://4.224.186.213/evaluation-service/notifications   (protected route)
```

### Scoring code

```ts
const TYPE_WEIGHTS: Record<string, number> = {
  Result: 5,
  Placement: 4,
  Event: 3,
  General: 2,
};

const DEFAULT_WEIGHT = 1;
const RECENCY_HALF_LIFE_HOURS = 12;

function typeWeight(type: string): number {
  return TYPE_WEIGHTS[type] ?? DEFAULT_WEIGHT;
}

function recencyScore(timestamp: string, now: number): number {
  const parsed = Date.parse(timestamp.replace(" ", "T") + "Z");
  if (Number.isNaN(parsed)) return 0;
  const ageHours = Math.max(0, (now - parsed) / (1000 * 60 * 60));
  return Math.pow(0.5, ageHours / RECENCY_HALF_LIFE_HOURS);
}

function getTopPriority(notifications, limit) {
  const now = Date.now();
  return notifications
    .map((item) => ({ ...item, score: typeWeight(item.Type) + recencyScore(item.Timestamp, now) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
```

### Sample output

`GET http://localhost:4000/api/notifications/priority?n=10` returns the highest
scoring notifications first:

```
5.94  Result     2026-06-26 05:41:13  external
5.94  Result     2026-06-26 05:36:52  internal
5.88  Result     2026-06-26 04:34:46  internal
5.84  Result     2026-06-26 03:36:16  external
5.71  Result     2026-06-26 00:42:16  end-sem
```

Recent `Result` items rank highest, which matches the model: high type weight plus
a strong recency score.

### Maintaining the top `n` efficiently as new notifications arrive

Re-sorting every notification on each insert is wasteful. Instead keep a
**bounded min-heap of size `n`**, keyed by score:

- The heap always holds the current best `n`; its root is the weakest of the top.
- On a new notification, compute its score and compare with the heap root:
  - if the heap has fewer than `n` items, push it;
  - else if the new score is greater than the root, pop the root and push the new
    one;
  - else ignore it.
- Each insert is **O(log n)** instead of **O(N log N)** for a full re-sort, and
  memory stays bounded at `n`.

For recency that decays continuously, recompute scores periodically (the relative
order of recent items changes slowly) or refresh the heap on read.
