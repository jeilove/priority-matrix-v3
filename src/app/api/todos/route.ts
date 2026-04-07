import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const todos = await prisma.todo.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(todos);
  } catch (error: any) {
    const errorDetail = error.message || String(error);
    console.error("❌ API[GET] Fetch Error:", errorDetail);
    return NextResponse.json({ 
      error: "Failed to fetch todos", 
      details: errorDetail,
      code: error.code // Prisma 에러 코드 포함
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  
  console.log("📡 API[POST]: Sync Request received", { userId: user?.id, email: user?.email });

  if (!user?.id) {
    console.warn("⚠️ API[POST]: Unauthorized request (no user.id)");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { todos } = await req.json();
    console.log(`📡 API[POST]: Syncing ${todos.length} items for user ${user.id}`);
    
    // 1. 유저 존재 확인 및 동기화
    await prisma.user.upsert({
      where: { id: user.id },
      update: { name: user.name, email: user.email, image: user.image },
      create: { id: user.id, name: user.name, email: user.email, image: user.image }
    });

    // 2. ID 리스트 확보
    const existingTodos = await prisma.todo.findMany({
      where: { userId: user.id },
      select: { id: true }
    });
    const existingIds = existingTodos.map(t => t.id);
    const newIds = todos.map((t: any) => t.id);

    // 3. 존재하지 않는 항목 삭제
    const toDelete = existingIds.filter(id => !newIds.includes(id));
    if (toDelete.length > 0) {
      console.log(`📡 API[POST]: Deleting ${toDelete.length} legacy items`);
      await prisma.todo.deleteMany({
        where: { id: { in: toDelete } }
      });
    }

    // 4. 모든 항목 업데이트/생성
    if (todos.length > 0) {
      for (const todo of todos) {
        await prisma.todo.upsert({
          where: { id: todo.id },
          update: {
            text: todo.text || "",
            estimate: todo.estimate,
            energy: todo.energy,
            status: todo.status || "todo",
            quadrant: todo.quadrant || "q1",
            repetition: todo.repetition || [],
            context: todo.context || [],
            tags: todo.tags || [],
            description: todo.description,
            priorityRank: todo.priorityRank ?? 9999,
            isHidden: todo.isHidden ?? false,
            updatedAt: todo.updatedAt ? new Date(todo.updatedAt) : undefined,
          },
          create: {
            id: todo.id,
            userId: user.id,
            text: todo.text || "",
            estimate: todo.estimate,
            energy: todo.energy,
            status: todo.status || "todo",
            quadrant: todo.quadrant || "q1",
            repetition: todo.repetition || [],
            context: todo.context || [],
            tags: todo.tags || [],
            description: todo.description,
            priorityRank: todo.priorityRank ?? 9999,
            isHidden: todo.isHidden ?? false,
            createdAt: todo.createdAt ? new Date(todo.createdAt) : undefined,
            updatedAt: todo.updatedAt ? new Date(todo.updatedAt) : undefined,
          },
        });
      }
    }

    console.log("✅ API[POST]: Sync Success for", user.id);
    return NextResponse.json({ success: true, synced: todos.length });
  } catch (error: any) {
    console.error("❌ API[POST]: Sync Failure!", error.message);
    return NextResponse.json({ error: "Failed to sync todos", details: error.message }, { status: 500 });
  }
}
