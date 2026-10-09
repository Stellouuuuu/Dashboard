import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

const PORT = 4103;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(PORT);
  console.log(`NestJS POC listening on :${PORT}`);
}

bootstrap();
