"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTodoStore } from "@/store/useTodoStore";

export default function SyncManager() {
  const { status } = useSession();
  const { todos, syncToDB, syncFromDB } = useTodoStore();
  const [initialFetchDone, setInitialFetchDone] = useState(false);

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
          // 실패하더라도 initialFetchDone을 true로 설정하여
          // 로컬에서 새로 입력하는 데이터가 DB에 저장될 수 있게 합니다.
          setInitialFetchDone(true);
        });
    }

    // 비로그인 상태로 전환 시 초기화
    if (status === "unauthenticated") {
      setInitialFetchDone(false);
    }
  }, [status, initialFetchDone]);

  // 2. 데이터 변경 시 DB에 자동 저장 (Debounce 2초)
  // isSyncing은 가드로 쓰지 않음: deps에 없으면 sync 완료 후 effect가 재실행되지 않아
  // sync 중 추가된 todo가 영구적으로 유실됩니다. syncToDB는 get().todos로 최신 상태를 읽으므로 안전합니다.
  useEffect(() => {
    if (status !== "authenticated" || !initialFetchDone) {
      return;
    }

    const timer = setTimeout(() => {
      console.log("💾 SyncManager: 자동 저장 실행 (count:", todos.length, ")");
      syncToDB()
        .then(() => console.log("✅ SyncManager: 자동 저장 완료"))
        .catch(err => console.error("❌ SyncManager: 자동 저장 에러:", err));
    }, 2000);

    return () => clearTimeout(timer);
  }, [todos, status, initialFetchDone]);

  return null;
}
