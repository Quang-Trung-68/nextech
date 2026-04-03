import "dotenv/config";
import { defineConfig, env } from "prisma/config";


export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Prisma 7 đọc seed từ đây (package.json prisma.seed không còn dùng cho `prisma db seed`)
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
