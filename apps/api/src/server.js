import "dotenv/config";
import createApp from "./app.js";

const bootstrap = async () => {
  const port = process.env.PORT || 8080;

  const app = createApp();

  app.listen(port, () => {
    console.log(`Server Start: http://localhost:${port}`);
  });
};

bootstrap();
