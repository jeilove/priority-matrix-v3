// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"], // 프로덕션에서는 에러만 로깅
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
