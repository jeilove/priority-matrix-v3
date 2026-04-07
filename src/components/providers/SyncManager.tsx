"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTodoStore } from "@/store/useTodoStore";

export default function SyncManager() {
  const { status } = useSession();
  const { todos, syncToDB, syncFromDB } = useTodoStore();
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  // ref로 관리: initialFetchDone이 true로 바뀌는 것 자체가 auto-save를 트리거하지 않도록 분리
  const autoSaveEnabledRef = useRef(false);

  // 1. 로그인 시: DB에서 먼저 불러오기 (1회만)
  useEffect(() => {
    if (status === "authenticated" && !initialFetchDone) {
      console.log("🔄 SyncManager: 로그인 감지 - DB 로드 시도");
      syncFromDB()
        .then(() => {
          console.log("✅ SyncManager: DB 로드 성공. (이제부터 자동 저장을 허용합니다)");
          setInitialFetchDone(true);
        })
        .catch(err => {
          console.error("❌ SyncManager: DB 로드 실패.", err);
          setInitialFetchDone(true);
        });
    }

    if (status === "unauthenticated") {
      setInitialFetchDone(false);
    }
  }, [status, initialFetchDone]);

  // initialFetchDone 변경을 ref에 동기화 (auto-save effect의 deps에서 제외하기 위함)
  useEffect(() => {
    autoSaveEnabledRef.current = initialFetchDone;
  }, [initialFetchDone]);

  // 2. todos가 실제로 변경될 때만 DB에 자동 저장 (Debounce 2초)
  // initialFetchDone을 deps에서 제외 → 로그인 시 불필요한 업로드 방지
  // autoSaveEnabledRef로 초기 fetch 완료 여부를 확인
  useEffect(() => {
    if (status !== "authenticated" || !autoSaveEnabledRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      console.log("💾 SyncManager: 자동 저장 실행 (count:", todos.length, ")");
      syncToDB()
        .then(() => console.log("✅ SyncManager: 자동 저장 완료"))
        .catch(err => console.error("❌ SyncManager: 자동 저장 에러:", err));
    }, 2000);

    return () => clearTimeout(timer);
  }, [todos, status]);

  return null;
}
