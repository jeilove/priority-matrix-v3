// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

/**
 * DATABASE_URL에 PgBouncer 호환 모드를 위한 pgbouncer=true 파라미터를 강제로 주입합니다.
 * "cached plan must not change result type" 에러는 세션이 꼬일 때 발생하므로, 
 * 모든 연결에서 명시적으로 파라미터를 확인하고 추가해야 합니다.
 */
function getDbUrl() {
  let url = process.env.DATABASE_URL || ""
  
  if (!url) return url;

  // 이미 pgbouncer=true가 있으면 그대로 반환
  if (url.includes("pgbouncer=true")) return url;

  // URL에 쿼리 스트링(?...)이 있는지 확인 후 추가
  const separator = url.includes("?") ? "&" : "?";
  const fixedUrl = `${url}${separator}pgbouncer=true`;
  
  console.log("📡 Prisma: Database URL enhanced with pgbouncer=true");
  return fixedUrl;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDbUrl(), // 명시적으로 주입
      },
    },
    log: ["error"], 
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
