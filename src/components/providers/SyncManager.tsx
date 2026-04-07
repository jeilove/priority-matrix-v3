"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTodoStore } from "@/store/useTodoStore";

export default function SyncManager() {
  const { data: session, status } = useSession();
  const { todos, syncToDB, syncFromDB, isSyncing, ensureGuideTodos } = useTodoStore();

  // 0. 초기화: 목록이 비어있으면 즉시 가이드 데이터 생성
  useEffect(() => {
    console.log("🔍 SyncManager: Initializing Guide Todos Check...", { todosLength: todos.length });
    const timer = setTimeout(() => {
      ensureGuideTodos();
    }, 1500); // 더 넉넉하게 대기
    return () => clearTimeout(timer);
  }, []);

  // 1. 로그인 시 DB에서 데이터 가져오기
  useEffect(() => {
    console.log("🔍 SyncManager: Auth Status changed to:", status);
    if (status === "authenticated") {
      console.log("🔄 SyncManager: Start fetching from DB...");
      syncFromDB()
        .then(() => console.log("✅ SyncManager: DB Fetch Success!"))
        .catch(err => console.error("❌ SyncManager: DB Fetch Error:", err));
    }
  }, [status]);

  // 2. 데이터 변경 시 DB에 자동 저장 (Debounced logic could be added here)
  useEffect(() => {
    if (status === "authenticated" && !isSyncing && todos.length > 0) {
      const timer = setTimeout(() => {
        syncToDB().catch(err => console.error("Auto Sync Error:", err));
      }, 2000); // 2초 뒤 자동 저장
      return () => clearTimeout(timer);
    }
  }, [todos, status]);

  return null;
}
