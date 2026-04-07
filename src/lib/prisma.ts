import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'

// 서버리스 환경 성능 최적화
neonConfig.fetchConnectionCache = true

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL
  if (!rawUrl) {
    throw new Error("❌ DATABASE_URL is missing in environment variables.")
  }

  // Neon Serverless 드라이버 충돌 방지를 위해 sslmode 등 쿼리 스트링 정제 (필요 시)
  // 대부분의 경우 기본 URL만으로 충분합니다.
  const connectionString = rawUrl.includes('?') ? rawUrl.split('?')[0] : rawUrl;

  // 로컬/프로덕션 모두에서 Neon Serverless 어댑터 방식 사용 (Prisma 7 표준)
  console.log("📡 Prisma: Initializing with Neon Adapter...")
  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool as any)
  
  return new PrismaClient({ adapter } as any)
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
