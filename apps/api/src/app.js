import express from "express";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth/index.js";
import loginRouter from "./routes/login.js";
import webhookLineRouter from "./routes/webhook-line.js";
import notificationRouter from "./routes/notification.js";

const createApp = () => {
  const app = express();

  // Webhook ルートは express.json() の前に配置（署名検証のため）
  app.use("/webhook-line", webhookLineRouter);

  //middleware
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/login", loginRouter);
  app.use("/notification", notificationRouter);
  return app;
};

export default createApp;
