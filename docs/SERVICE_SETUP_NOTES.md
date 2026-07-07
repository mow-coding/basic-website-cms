# 서비스 설정 노트

이 문서는 Basic Website CMS가 사용하는 외부 서비스를 설명합니다.

목표는 초심자가 각 서비스의 역할을 이해한 상태에서 AI와 함께 설정하게 만드는 것입니다.

## GitHub: 코드 창고

GitHub는 프로젝트 코드와 변경 기록을 보관합니다.

이 키트에서 GitHub가 필요한 이유:

- 코드가 안전하게 보관됩니다.
- 누가 무엇을 바꿨는지 기록됩니다.
- AI와 사용자가 같은 프로젝트 상태를 기준으로 일할 수 있습니다.
- Vercel이 GitHub에서 최신 코드를 가져와 배포할 수 있습니다.

초심자용 설명:

> GitHub는 코드 창고입니다. Basic Website CMS 코드가 여기에 보관됩니다. Vercel은 이 창고에서 최신 코드를 가져가 웹사이트로 포장합니다.

AI가 도울 수 있는 일:

- GitHub 계정 만들기 안내
- GitHub CLI 설치 확인
- `gh auth login` 로그인 안내
- 새 저장소 만들기 또는 이 저장소 복사하기
- 커스터마이즈한 프로젝트를 GitHub에 push하기

## Vercel: 포장·배송 센터

Vercel은 코드를 사람들이 방문할 수 있는 웹사이트로 바꿔줍니다.

이 키트에서는 보통 Vercel 프로젝트가 두 개 필요합니다.

- `apps/site`: 공개 웹사이트
- `apps/admin`: 관리자 콘솔

초심자용 설명:

> Vercel은 포장·배송 센터입니다. GitHub 창고에서 코드를 가져와 실제 웹사이트로 포장하고, 인터넷 주소로 배송해 줍니다.

AI가 도울 수 있는 일:

- Vercel 계정 만들기 안내
- Vercel CLI 설치 확인
- `vercel login` 로그인 안내
- `apps/site`용 Vercel 프로젝트 만들기
- `apps/admin`용 Vercel 프로젝트 만들기
- 환경변수 추가하기
- 배포 상태와 production URL 확인하기

중요한 설정:

```text
공개 사이트 프로젝트 Root Directory: apps/site
관리자 콘솔 프로젝트 Root Directory: apps/admin
```

## Neon: 데이터 금고

Neon은 PostgreSQL 데이터베이스를 제공합니다.

이 키트에서 Neon은 관리자 콘솔로 바뀔 수 있는 정보를 저장합니다.

- 게시글
- 일정
- 페이지 내용
- 첨부파일 정보
- 관리자에 의해 관리되는 콘텐츠

초심자용 설명:

> Neon은 데이터 금고입니다. 코드는 GitHub에 있지만, 관리자가 바꾸는 게시글과 일정 같은 데이터는 Neon에 안전하게 저장됩니다.

AI가 도울 수 있는 일:

- Neon 계정 만들기 안내
- Neon CLI 설치 확인
- `neonctl auth` 로그인 안내
- 프로젝트와 데이터베이스 만들기
- 데이터베이스 연결 문자열을 `DATABASE_URL`에 넣도록 안내
- Prisma 설정 명령 실행

`DATABASE_URL`은 절대 공개하면 안 됩니다. 데이터베이스에 접근할 수 있는 정보가 들어 있습니다.

## GCP / Google OAuth: 관리자 출입증 발급소

Google OAuth는 관리자 콘솔을 Google 로그인으로 보호합니다.

이 단계는 가장 수동적인 편입니다. AI가 안내할 수는 있지만, 사용자가 Google Cloud Console 화면에서 직접 설정해야 합니다.

초심자용 설명:

> GCP에서는 관리자 로그인 출입증을 만듭니다. Google OAuth는 관리자 콘솔이 Google에게 "이 사람이 로그인해도 되는 사람인가요?"라고 물어볼 수 있게 해주는 Client ID와 Client Secret을 발급합니다.

사용자가 직접 해야 하는 대표 단계:

1. Google Cloud Console을 엽니다.
2. Google Cloud 프로젝트를 만들거나 선택합니다.
3. OAuth 동의 화면을 설정합니다.
4. 웹 애플리케이션용 OAuth Client ID를 만듭니다.
5. 승인된 리디렉션 URI를 등록합니다.
6. Client ID와 Client Secret을 로컬 env와 Vercel 환경변수에 넣습니다.

자주 쓰는 리디렉션 URI:

```text
로컬 관리자:
http://localhost:3001/api/auth/callback/google

배포된 관리자:
https://YOUR_ADMIN_DOMAIN/api/auth/callback/google
```

자주 쓰는 JavaScript origin:

```text
로컬 관리자:
http://localhost:3001

배포된 관리자:
https://YOUR_ADMIN_DOMAIN
```

`GOOGLE_OAUTH_CLIENT_SECRET`은 AI 채팅에 그대로 붙여넣지 마세요. 아래 위치에 직접 넣는 것이 좋습니다.

- 로컬 개발: `apps/admin/.env.local`
- 배포 환경: Vercel environment variables

## 환경변수

예시 파일:

- `apps/site/.env.example`
- `apps/admin/.env.example`

환경변수 이름은 시스템 계약입니다. 특별한 이유 없이 이름을 바꾸지 마세요. 보통은 이름은 그대로 두고 값만 바꿉니다.

중요한 예:

- `DATABASE_URL`: Neon 데이터베이스 연결 문자열
- `NEXTAUTH_URL`: 관리자 앱 주소
- `NEXTAUTH_SECRET`: NextAuth가 사용하는 비밀값
- `GOOGLE_OAUTH_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_OAUTH_CLIENT_SECRET`: Google OAuth Client Secret
- `SITE_ADMIN_API_URL`: 공개 사이트가 읽을 관리자 공개 API 주소
- `SITE_REVALIDATE_SECRET`: 캐시 재검증에 쓰는 공유 비밀값
- `SITE_REVALIDATE_URL`: 공개 사이트 재검증 엔드포인트

## 배포 확인

배포 후에는 아래를 확인하세요.

- Vercel deployment state가 `READY`인지
- 공개 사이트 URL이 `200`으로 응답하는지
- 관리자 로그인 URL이 `200`으로 응답하는지
- 배포된 커밋이 의도한 커밋인지
- 환경변수가 올바른 Vercel 프로젝트에 들어갔는지
