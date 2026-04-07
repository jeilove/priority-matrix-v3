import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error("❌ CRITICAL: DATABASE_URL is missing!")
    throw new Error("DATABASE_URL environment variable is not set")
  }

  // 로컬 환경에서는 표준 PrismaClient (TCP), 프로덕션에서는 Neon 어댑터 (WebSocket)
  if (process.env.NODE_ENV !== 'production') {
    console.log("📡 Prisma: 로컬 모드 (Standard TCP) 연결 중...")
    return new PrismaClient()
  }

  console.log("📡 Prisma: 프로덕션 모드 (Neon WebSocket) 연결 중...")
  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool as any)
  return new PrismaClient({ adapter } as any)
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
