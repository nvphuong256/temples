// Prisma client dùng chung (Prisma 7 bắt buộc driver adapter → @prisma/adapter-pg).
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

export function createDb(url = process.env["DATABASE_URL"]): PrismaClient {
  if (!url) throw new Error("DATABASE_URL is not set");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}
