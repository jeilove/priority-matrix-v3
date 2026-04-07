# VIBE_CODING_KNOWLEDGE_BASE (v1.0.0)

본 문서는 모든 '바이브 코딩' 프로젝트에서 반복적으로 발생하는 기술적 함정(Pitfalls)과 이를 해결하기 위한 검증된 솔루션(Proven Solutions)을 집대성한 공식 지식 자산입니다. 모든 신규 에이전트는 작업 시작 전 본 문서를 반드시 정독하고 숙지해야 합니다.

---

## 🏗️ 1. 인프라 및 프로세스 제어 (Infrastructure & Process Strategy)

### 📌 [이슈] 포트 충돌 및 좀비 프로세스 (Zombie Processes)
*   **상황**: `npm run dev` 실행 시 "Port 3001 is already in use" 에러가 발생하거나, 서버는 돌아가는데 코드 수정이 반영되지 않는 현상.
*   **해결**: `start.bat`에 다음 로직을 반드시 포함하여 실행 전 포트를 점유 중인 프로세스를 강제 종료(KILL)해야 함.
    - `netstat -ano | findstr :3001`
    - `taskkill /F /PID [PID]`
*   **절대 엄수**: 에이전트는 "포트를 수동으로 바꿔보세요"라고 사용자에게 제안하지 말 것. 시스템이 알아서 정리해야 함.

### 📌 [이슈] 하드웨어 호환성 (BMI2 CPU Issue)
*   **상황**: Next.js v16+ 및 최신 Turbopack 엔진이 특정 구형 CPU(BMI2 명령어 미지원)에서 패닉(Panic)을 일으키며 서버를 중단시킴.
*   **해결**: 하드웨어 가용성이 확인되지 않은 경우, 항상 **안정된 버전(Next.js v15.1.x 등)**을 고정하여 사용하고, 실험적 기능(Turbopack 등) 대신 **Webpack 기반 엔진**을 사용할 것.

---

## ⚡ 2. 캐시 고착 및 렌더링 동기화 (Caching & Synchronization)

### 📌 [이슈] 무력한 새로고침 (Refresh vs Cache)
*   **상황**: 브라우저를 새로고침해도 디자인이나 데이터가 바뀌지 않음.
*   **원인**: Next.js의 강력한 빌드 캐시 및 브라우저의 전역 캐시가 원인임.
*   **해결**:
    - **파일단위**: 파일명을 바꾸거나(`_v2` 등) 캐시 버스팅 쿼리(`?v=1.0.1`)를 적용.
    - **서버단위**: `.next` 폴더를 삭제하고 다시 빌드하는 `dev:clean` 명령어를 활용.
    - **코드단위**: `export const dynamic = 'force-dynamic';` 선언을 통해 정적 렌더링 캐시를 원천 차단.

### 📌 [이슈] `window.location.reload()`의 남발
*   **경고**: 화면 갱신을 위해 브라우저를 강제로 새로고침하는 로직은 유저 경험을 해치며, 근본적인 상태 관리 실패의 증거임.
*   **솔루션**: 데이터 Fetch 후 React State를 즉시 업데이트하거나, `router.refresh()`를 사용하여 필요한 부분만 리렌더링할 것.

---

## 🎨 3. 스타일링 및 UI/UX (Styling & Design System)

### 📌 [이슈] 스타일링 스코프 유실
*   **상황**: Tailwind CSS나 Scoped CSS가 특정 레이아웃에서만 깨지거나 적용되지 않는 현상.
*   **해결**: `globals.css` 의존성보다 해당 컴포넌트 내부에 스타일을 직접 주입하거나, 레이아웃에 직접 `style jsx`를 사용하여 최우선 순위(Specificity)를 확보할 것.

---

## 🤝 4. 작업 협업 및 결정 (Decision Strategy)

### 📌 [원칙] 랄프 루프 (Ralph-loop) 준수
*   방대한 코드를 한 번에 작성하지 말고, 기획(Plan) -> 구현(Execute) -> 검토(Evaluate)의 3단계를 수행하며 **Phase 단위**로 작업을 분할하여 사용자 승인을 받을 것.

### 📌 [원칙] 과잉 해석 금지 (Rule of Least Surprise)
*   사용자의 지시(예: A 영역만 고쳐줘)를 넘어서 "앞서가는 판단"으로 타 영역(B, C)까지 임의로 확장하지 말 것. 내부적 편의 보강(배지 추가 등)은 좋으나, 외부 통제(전역 필터 등)는 반드시 승인 후 진행할 것.

---

## 📜 5. 문서화 수칙 (Documentation Standard)
*   모든 프로젝트는 `CHANGELOG.md`(이력), `debug_history.md`(오류), `task.md`(진행도), `walkthrough.md`(산출물)를 최신 상태로 유지하여, 다음 에이전트가 즉시 컨텍스트를 파악할 수 있도록 한다.
