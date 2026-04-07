import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'

// 서버리스 환경 성능 최적화
neonConfig.fetchConnectionCache = true

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    throw new Error("❌ DATABASE_URL is missing in environment variables.")
  }

  // 로컬/프로덕션 모두에서 Neon Serverless 어댑터 방식 사용 (Prisma 7 표준)
  // 로컬에서 TCP 분기 시 발생하는 복잡한 타입 에러(datasources vs datasourceUrl)를 원천 차단
  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool as any)
  
  return new PrismaClient({ adapter } as any)
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
