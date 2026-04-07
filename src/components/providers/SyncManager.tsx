"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTodoStore } from "@/store/useTodoStore";

export default function SyncManager() {
  const { data: session, status } = useSession();
  const { todos, syncToDB, syncFromDB, isSyncing } = useTodoStore();

  // 1. 로그인 시 DB에서 데이터 가져오기 (초기 1회)
  useEffect(() => {
    if (status === "authenticated") {
      syncFromDB().catch(err => console.error("Initial Sync Error:", err));
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
