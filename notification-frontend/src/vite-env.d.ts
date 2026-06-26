/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_EVALUATION_BASE_URL: string;
  readonly VITE_AUTH_EMAIL: string;
  readonly VITE_AUTH_NAME: string;
  readonly VITE_AUTH_ROLL_NO: string;
  readonly VITE_AUTH_ACCESS_CODE: string;
  readonly VITE_AUTH_CLIENT_ID: string;
  readonly VITE_AUTH_CLIENT_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
