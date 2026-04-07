import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    return NextResponse.json({ error: "DATABASE_URL is missing" }, { status: 500 });
  }

  // URL 마스킹 및 정제 (DB URL에 포함된 인증 정보를 가리고 중복된 쿼리 파라미터를 제거)
  const cleanedConnectionString = (process.env.DATABASE_URL || "").includes('?') 
    ? (process.env.DATABASE_URL || "").split('?')[0] 
    : (process.env.DATABASE_URL || "");
    
  const maskedUrl = cleanedConnectionString.replace(/:[^:@]+@/, ":****@");
  console.log("📡 Debug-DB: Testing connection to", maskedUrl);

  const pool = new Pool({ connectionString: cleanedConnectionString });
  
  try {
    const start = Date.now();
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    client.release();
    
    return NextResponse.json({ 
      success: true, 
      time: res.rows[0].now,
      duration: `${Date.now() - start}ms`,
      maskedUrl 
    });
  } catch (err: any) {
    console.error("❌ Debug-DB Error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || String(err),
      stack: err.stack,
      details: JSON.stringify(err, Object.getOwnPropertyNames(err))
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}
