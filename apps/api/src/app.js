import express from "express";
import healthRouter from "./routes/health.js";

export function createApp() {
  const app = express();

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.use("/health", healthRouter);
  return app;
}
