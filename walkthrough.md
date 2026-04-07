# Walkthrough: Neon DB & 구글 로그인 서버 측 통합 (v3.1.6)

## 목표
기존 로컬 스토리지 및 Google Drive 방식의 한계를 극복하고, Vercel Serverless 환경과 Neon PostgreSQL DB를 결합하여 강력한 실시간 데이터 동기화 및 보안 로그인 시스템을 구축합니다.

## 진행 작업 (Source Updates)
1. **서버리스 아키텍처 구축**
   - **Neon Database**: PostgreSQL을 클라우드 데이터베이스로 채택하여 데이터 영속성 확보.
   - **Prisma Client (v7.x)**: Neon 전용 어댑터(`@prisma/adapter-neon`)를 사용하여 서버리스 환경에서 최적의 성능과 안정적인 연결 보장.

2. **NextAuth.js 인증 시스템 통합**
   - **Google Provider**: 구글 계정을 이용한 안전한 로그인을 구현.
   - **Prisma Adapter**: 인증 정보를 Neon DB와 연동하여 세션 관리 및 사용자 프로필 저장.
   - **Header UI**: 헤더에 사용자 프로필 이미지, 로그인/로그아웃 버튼 및 v3.1.6 버전 배지 적용.

3. **실시간 백그라운드 동기화 (SyncManager)**
   - **Hydration**: 로그인 시 DB에서 최신 할 일 목록을 자동으로 패치하여 로컬 스토어에 반영.
   - **Auto-Sync**: 할 일 추가/수정/삭제 시 2초 간격으로 백그라운드에서 DB와 자동 동기화 (`syncToDB`).
   - **API Routes**: `/api/todos` 엔드포인트를 통해 서버 측에서 CRUD 로직 처리.

4. **배포 안정화 및 보안 패치**
   - **Framework Patch**: Vercel의 보안 정책을 충족하기 위해 Next.js를 **v16.2.2**로 강제 업데이트.
   - **Build Script**: 빌드 및 설치 시 `prisma generate`가 자동 실행되도록 `package.json` 최적화.
   - **Force-Dynamic**: 모든 API 라우트에 동적 렌더링을 강제하여 빌드 타임 DB 연결 오류 방지.

## 결과
- 사용자는 어떤 기기에서든 구글 로그인을 통해 자신의 할 일 목록을 즉시 동기화할 수 있음.
- 데이터가 브라우저가 아닌 보안이 강화된 클라우드 DB에 저장되어 유실 위험이 사라짐.
- Vercel 배포 시 발생하던 보안 및 빌드 오류를 완벽하게 해결하여 안정적인 서비스 운영 가능.
- 로컬 실행 시 `run_app.bat`을 통해 좀비 프로세스 걱정 없이 원클릭으로 개발 환경 구동 가능.
