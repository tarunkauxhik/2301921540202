import { NextFunction, Request, Response } from "express";
import { Log } from "../logging";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  Log("backend", "info", "middleware", `${req.method} ${req.originalUrl}`);
  next();
}
