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
    console.error("❌ Fetch Error Details:", {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    return NextResponse.json({ error: "Failed to fetch todos", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { todos } = await req.json();
    
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
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Sync Error Details:", {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    return NextResponse.json({ error: "Failed to sync todos", details: error.message }, { status: 500 });
  }
}
