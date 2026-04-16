/**
 * Express server entry point.
 */

import express from "express";
import { router } from "./routes.js";

const app = express();

app.use(express.json({ limit: "10mb" }));

// Permissive CORS for development.
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use("/", router);

export function startServer(port = parseInt(process.env["PORT"] ?? "3001", 10)): void {
  app.listen(port, () => {
    console.log(`rust-base-optimizer API listening on port ${port}`);
  });
}

// Start if run directly.
const isMain = process.argv[1]?.endsWith("server.js") || process.argv[1]?.endsWith("server.ts");
if (isMain) {
  startServer();
}

export { app };
