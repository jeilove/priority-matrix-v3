import os

target_path = r"C:\Users\ACECOM\.gemini\GLOBAL_DEBUG_HISTORY.md"
content = """

---

## [DONE] 2026-04-09 - 모바일 DnD 드래그 풀림 해결 (2차 보정): 센서 분리 및 허용 오차 확대 (priority-matrix-v3)

### 현상
- `touch-action: none` 적용 후에도 모바일에서 드래그가 시작되자마자 풀리는 현상 지속.

### 원인
1. **센서 간 경합**: `PointerSensor`는 마우스와 터치를 모두 감지하는데, 터치 환경에서 마우스용 활성화 규칙(지연 시간 없음, 작은 거리 임계치)이 먼저 작동하여 터치 전용 지연 설정을 무용지물로 만듦.
2. **엄격한 임계치**: 모바일 터치는 손가락 면적이 넓어 미세한 떨림이 발생하기 쉬움. `tolerance: 5px`는 너무 엄격하여 드래그 준비 단계에서 이미 임계치를 초과하여 취소됨.

### 해결
1. **센서 분리**: `PointerSensor`를 제거하고, PC용 **`MouseSensor`**와 모바일용 **`TouchSensor`**를 독립적으로 선언함. 이렇게 하면 터치 이벤트는 오직 `TouchSensor`의 규칙(250ms 지연 등)에만 반응하게 됨.
2. **허용 오차 확대**: `TouchSensor`의 `tolerance`를 **`20px`**로 상향하여, 드래그 시작 전까지의 자연스러운 손가락 떨림을 허용함.
3. **텍스트 선택 방지**: `user-select: none`과 `-webkit-user-select: none`을 추가하여 드래그 중 의도치 않은 텍스트 블록 설정이 발생하는 것을 막음.

### 교훈
- **PointerSensor의 함정**: 모바일 터치 대응 시 `PointerSensor` 하나로 뭉뚱그려 처리하기보다, `Mouse`와 `Touch` 센서를 완전히 분리하여 각 환경에 맞는 정밀한 제약 조건(Constraints)을 부여하는 것이 훨씬 안정적임.

### 태그
- #모바일DnD #센서분결 #MouseSensor #TouchSensor #Tolerance #드래그안정화 #성공

---
"""

try:
    with open(target_path, "a", encoding="utf-8") as f:
        f.write(content)
    print("Successfully appended mobile DnD 2nd fix to Global history.")
except Exception as e:
    print(f"Error appending history: {e}")
