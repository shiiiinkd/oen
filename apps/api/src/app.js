import express from "express";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth/index.js";
import loginRouter from "./routes/login.js";

const createApp = () => {
  const app = express();

  //middleware
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/login", loginRouter);

  return app;
};

export default createApp;
