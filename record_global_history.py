import os

target_path = r"C:\Users\ACECOM\.gemini\GLOBAL_DEBUG_HISTORY.md"
content = """

## 🛑 [DONE] v3.8.9 데이터 동기화 교착 및 광고 차단 프로그램 충돌 (priority-matrix-v3, 2026-04-07)

### 현상
- 온라인에서 할 일을 추가했는데, 로컬 PC에서 새로고침해도 데이터가 로드되지 않고 'Already synced' 로그만 출력됨.
- 로컬 PC 로그인 직후에 온라인에서 추가한 데이터가 잠시 보였다가 사라지고 0개가 됨 (데이터 유실).
- 특정 환경(크롬)에서 `/api/todos` 호출 자체가 중단되거나 응답을 받지 못함.

### 원인
1. **타임스탬프 교착 (Timestamp Tie-break)**: db.updatedAt === local.lastModifiedAt인 경우 로직이 '동기화 완료'로 판단하여 실제 데이터 차이(0개 vs 2개)가 있어도 업데이트를 스킵함.
2. **파괴적 자동 저장 (Race Condition)**: syncFromDB(Pull)가 완료되어 로컬 저장소를 채우기 전이나 찰나의 순간에 syncToDB(Push)가 트리거되어, 로컬의 빈 상태(0개)가 서버의 정상 데이터를 덮어써서 삭제해버림.
3. **광고 차단 프로그램(Ad Blocker) 간섭**: uBlock Origin, AdGuard 등 브라우저 확장 프로그램이 `/api/todos`와 같은 엔드포인트를 광고/추적기 API로 오인하여 통신을 차단함.

### 해결
1. **스냅샷 우선 원칙 (Snapshot-First)**: syncFromDB 시점에 복잡한 시간 비교를 지향하고, 초기 로드 시에는 서버 데이터를 'Single Source of Truth'로 보고 로컬을 즉시 갱신하도록 로직 단순화.
2. **자동 저장 세이프가드**: initialFetchDone 플래그와 useRef를 조합하여, 서버로부터 데이터를 안전하게 1회 가져온 것이 확인된 이후에만 로컬 변경분의 자동 저장을 허용함.
3. **사용자 가이드**: 통신 장애 시 브라우저의 광고 차단 프로그램을 비활성화하도록 안내 추가.

### 핵심 교훈
- **동기화는 '가져오기'가 '저장'보다 압도적으로 우선되어야 함**: 가져오기가 확인되지 않은 상태에서의 저장은 곧 데이터 삭제(Overwrite with Null)와 같음.
- **클라이언트 시간 불확실성**: 기기 간의 시간은 1ms 단위까지 완벽히 일치할 수 없으므로, 시간 비교(Clock-sync)에만 의존하지 말고 데이터의 실제 내용(ID 목록, 개수 등)을 함께 대조할 것.
- **브라우저 확장 프로그램 변수**: API 호출 실패 시 코드 오류뿐만 아니라 광고 차단기 등 외부 간섭 요소를 0순위로 체크할 것.

**태그**: #데이터동기화 #교착상태 #광고차단기충돌 #데이터유실 #RaceCondition #SyncManager #2026-04-07
"""

try:
    with open(target_path, "a", encoding="utf-8") as f:
        f.write(content)
    print("Successfully appended today's debug history to Global history.")
except Exception as e:
    print(f"Error appending history: {e}")
