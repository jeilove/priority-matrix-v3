import { PrismaClient } from '@prisma/client'

// Prisma 7.x에서 서버리스 효율을 극대화하기 위해 글로벌 인스턴스 사용
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
