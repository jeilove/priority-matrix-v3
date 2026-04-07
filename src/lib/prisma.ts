// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function getDbUrl() {
  const url = process.env.DATABASE_URL || ""
  // PgBouncer(Neon Pooler) 호환 모드 강제 적용
  // "cached plan must not change result type" 에러 방지
  if (url && !url.includes("pgbouncer=true")) {
    return url.includes("?") ? url + "&pgbouncer=true" : url + "?pgbouncer=true"
  }
  return url
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: { db: { url: getDbUrl() } },
    log: ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
