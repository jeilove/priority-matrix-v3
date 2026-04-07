// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

/**
 * DATABASE_URL에 PgBouncer 호환 모드를 위한 pgbouncer=true 파라미터를 동적으로 추가합니다.
 * Neon Pooler 사용 시 발생하는 "cached plan must not change result type" 에러를 방지합니다.
 */
function getDbUrl() {
  const url = process.env.DATABASE_URL || ""
  if (url && !url.includes("pgbouncer=true")) {
    return url.includes("?") ? `${url}&pgbouncer=true` : `${url}?pgbouncer=true`
  }
  return url
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDbUrl()
      }
    },
    // log: ["query", "error", "warn"] // 필요시 쿼리 로그 활성화
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
