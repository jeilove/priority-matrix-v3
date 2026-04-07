"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTodoStore } from "@/store/useTodoStore";

export default function SyncManager() {
  const { status } = useSession();
  const { todos, syncToDB, syncFromDB, isSyncing, ensureGuideTodos } = useTodoStore();
  const initialFetchDone = useRef(false);

  // 1. 로그인 시: DB에서 먼저 불러오기 (1회만)
  //    DB가 비어있으면 가이드 데이터로 채우기
  useEffect(() => {
    if (status === "authenticated" && !initialFetchDone.current) {
      initialFetchDone.current = true;
      console.log("🔄 SyncManager: 로그인 감지 - DB에서 데이터 로드 시도");
      syncFromDB()
        .then(() => {
          console.log("✅ SyncManager: DB 로드 완료");
          // DB가 비어있으면 가이드 데이터 보장
          ensureGuideTodos();
        })
        .catch(err => {
          console.error("❌ SyncManager: DB 로드 실패:", err);
          // 실패해도 가이드 데이터는 보장
          ensureGuideTodos();
        });
    }

    // 비로그인 상태로 전환 시 초기화
    if (status === "unauthenticated") {
      initialFetchDone.current = false;
    }
  }, [status]);

  // 2. 로그인 상태에서 todos 변경 시 2초 후 DB에 저장 (Debounce)
  useEffect(() => {
    if (status !== "authenticated" || !initialFetchDone.current || isSyncing) return;

    const timer = setTimeout(() => {
      console.log("💾 SyncManager: 자동 저장 실행 (todos:", todos.length, "개)");
      syncToDB().catch(err => console.error("💾 Auto Sync Error:", err));
    }, 2000);

    return () => clearTimeout(timer);
  }, [todos, status]);

  return null;
}
