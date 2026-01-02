import express from "express";

async function bootstrap() {
  const port = process.env.PORT || 8080;

  const app = express();
  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.listen(port, () => {
    console.log(`Server Start: http://localhost:${port}`);
  });
}
bootstrap();
