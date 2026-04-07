import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is missing in .env");
  process.exit(1);
}

function createClient() {
  console.log("📡 Prisma: Neon WebSocket/Serverless 연결 중...");
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool as any);
  return new PrismaClient({ adapter } as any);
}

const prisma = createClient();

async function checkDB() {
  try {
    console.log('🔍 Neon DB 데이터 정밀 점검 시작...');
    
    const users = await prisma.user.findMany({
      include: {
        _count: { select: { todos: true } }
      }
    });

    console.log('\n--- 유저별 할일 통계 ---');
    if (users.length === 0) {
      console.log('등록된 유저가 없습니다.');
    } else {
      users.forEach(u => {
        console.log(`👤 유저: ${u.name} | ID: ${u.id} | 할일: ${u._count.todos}개`);
      });
    }

    const todos = await prisma.todo.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, text: true, userId: true, createdAt: true }
    });

    console.log('\n--- 최근 등록된 할일 10개 ---');
    todos.forEach(t => {
      console.log(`📝 [${t.userId}] ${t.text} (ID: ${t.id})`);
    });

  } catch (err) {
    console.error('❌ DB 조회 에러:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();
