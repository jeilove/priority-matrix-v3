const { Pool } = require('@neondatabase/serverless');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function testRaw() {
  console.log('🔗 원시 DB 데이터 재검증 중...');
  const pool = new Pool({ connectionString });
  
  try {
    const client = await pool.connect();
    
    // 유저 및 할일 개수 쿼리
    const userRes = await client.query('SELECT count(*) FROM "User"');
    console.log('👥 전체 유저 수:', userRes.rows[0].count);
    
    const todoRes = await client.query('SELECT count(*) FROM "Todo"');
    console.log('📝 전체 할일 수:', todoRes.rows[0].count);

    const recentTodos = await client.query('SELECT text, "userId" FROM "Todo" ORDER BY "createdAt" DESC LIMIT 10');
    console.log('\n--- 최근 할일 10개 ---');
    recentTodos.rows.forEach(r => {
      console.log(`[${r.userId.substring(0,8)}...] ${r.text}`);
    });

    client.release();
  } catch (err) {
    console.error('❌ DB 연결 실패:', err.message);
  } finally {
    await pool.end();
  }
}

testRaw();
