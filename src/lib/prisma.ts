import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'

// 서버리스 환경에서 페치 캐시 활성화 (성능 및 안정성)
neonConfig.fetchConnectionCache = true

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    throw new Error("❌ DATABASE_URL is missing in environment variables.")
  }

  // 로컬 개발 환경: 표준 TCP 방식 (Neon WebSocket 충돌 방지)
  if (process.env.NODE_ENV !== 'production') {
    console.log("📡 Prisma: Local Mode (Standard TCP)")
    return new PrismaClient({
      datasourceUrl: connectionString
    })
  }

  // 프로덕션 환경(Vercel): Neon Serverless 어댑터 방식
  console.log("📡 Prisma: Production Mode (Neon Serverless Adapter)")
  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool as any)
  return new PrismaClient({ adapter } as any)
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// 싱글톤 패턴 적용 (HMR 시 연결 누수 방지)
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
