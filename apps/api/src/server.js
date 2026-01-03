import { createApp } from "./app.js";

async function bootstrap() {
  const port = process.env.PORT || 8080;

  const app = createApp();

  app.listen(port, () => {
    console.log(`Server Start: http://localhost:${port}`);
  });
}
bootstrap();
