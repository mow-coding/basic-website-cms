# 환경변수 안내

환경변수는 앱이 읽는 설정 칸입니다. 값은 바꿀 수 있지만, 변수 이름은 시스템 계약이므로 특별한 이유 없이 바꾸지 않습니다.

비밀값은 채팅에 붙여넣지 마세요. AI는 이름과 위치를 설명하고, 사용자는 `.env.local` 또는 Vercel environment variables 화면에 직접 입력합니다.

## 어디에 넣나요?

| 위치 | 쓰임 |
| --- | --- |
| `apps/admin/.env.local` | 로컬 관리자 콘솔 |
| `apps/site/.env.local` | 로컬 공개 사이트 |
| Vercel `apps/admin` 프로젝트 | 배포된 관리자 콘솔 |
| Vercel `apps/site` 프로젝트 | 배포된 공개 사이트 |

Vercel 환경변수는 프로젝트별로 따로 넣어야 합니다. 공개 사이트 프로젝트에 들어갈 값과 관리자 콘솔 프로젝트에 들어갈 값이 다릅니다.

공식 참고:

- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Vercel env CLI](https://vercel.com/docs/cli/env)

## 관리자 콘솔 환경변수

파일:

```text
apps/admin/.env.example
apps/admin/.env.local
```

| 변수 | 비밀값인가요? | 로컬 예시 | 배포 예시 | 어디서 얻나요? | 설명 |
| --- | --- | --- | --- | --- | --- |
| `DATABASE_URL` | 예 | Neon direct connection string | Neon pooled 또는 direct connection string | Neon Console 또는 Neon CLI | 관리자 콘텐츠가 저장되는 PostgreSQL 연결 문자열입니다. |
| `NEXTAUTH_URL` | 아니오 | `http://localhost:3001` | `https://YOUR_ADMIN_DOMAIN` | 관리자 앱 주소 | Google 로그인 후 돌아올 관리자 앱의 기준 주소입니다. |
| `NEXTAUTH_SECRET` | 예 | 무작위 긴 문자열 | 무작위 긴 문자열 | 직접 생성 | 로그인 세션을 보호하는 열쇠값입니다. |
| `GOOGLE_OAUTH_CLIENT_ID` | 부분 공개 가능 | Google Client ID | Google Client ID | Google Cloud Console | Google이 발급한 관리자 출입증의 공개 식별자입니다. |
| `GOOGLE_OAUTH_CLIENT_SECRET` | 예 | Google Client Secret | Google Client Secret | Google Cloud Console | Google OAuth의 비밀 열쇠입니다. 채팅에 붙여넣지 않습니다. |
| `BLOB_READ_WRITE_TOKEN` | 예 | Vercel Blob token | Vercel Blob token | Vercel Storage | 첨부파일 업로드를 쓸 때 필요합니다. |
| `NEXT_PUBLIC_SITE_URL` | 아니오 | `http://localhost:3000` | `https://YOUR_SITE_DOMAIN` | 공개 사이트 주소 | 관리자 화면에서 공개 사이트 미리보기 링크를 만들 때 씁니다. |
| `SITE_REVALIDATE_URL` | 아니오 | `http://localhost:3000/api/revalidate` | `https://YOUR_SITE_DOMAIN/api/revalidate` | 공개 사이트 주소 | 관리자가 저장한 뒤 공개 사이트 캐시를 새로고침할 주소입니다. |
| `SITE_REVALIDATE_SECRET` | 예 | site 앱과 같은 값 | site 앱과 같은 값 | 직접 생성 | 관리자와 공개 사이트가 공유하는 캐시 재검증 열쇠입니다. |

`NEXTAUTH_SECRET` 생성 예시:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

생성된 값은 `.env.local`이나 Vercel 환경변수에 직접 넣고, 채팅에는 붙여넣지 않습니다.

## 공개 사이트 환경변수

파일:

```text
apps/site/.env.example
apps/site/.env.local
```

| 변수 | 비밀값인가요? | 로컬 예시 | 배포 예시 | 어디서 얻나요? | 설명 |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 아니오 | `http://localhost:3000` | `https://YOUR_SITE_DOMAIN` | 공개 사이트 주소 | 공개 사이트의 기준 주소입니다. SEO와 공유 이미지 주소에 쓰입니다. |
| `SITE_ADMIN_API_URL` | 아니오 | `http://localhost:3001/api/public-site` | `https://YOUR_ADMIN_DOMAIN/api/public-site` | 관리자 앱 주소 | 공개 사이트가 관리자 API에서 게시글과 일정을 읽는 주소입니다. |
| `SITE_REVALIDATE_SECRET` | 예 | admin 앱과 같은 값 | admin 앱과 같은 값 | 직접 생성 | `/api/revalidate`를 보호하는 공유 열쇠입니다. |
| `GOOGLE_SITE_VERIFICATION` | 아니오 | 비워둘 수 있음 | Google Search Console 값 | Google Search Console | Google 사이트 소유권 확인용 메타값입니다. |
| `NAVER_SITE_VERIFICATION` | 아니오 | 비워둘 수 있음 | Naver Search Advisor 값 | Naver Search Advisor | 네이버 사이트 소유권 확인용 메타값입니다. |
| `SITE_ATTACHMENT_BLOB_HOST` | 아니오 | 비워둘 수 있음 | Vercel Blob public host | Vercel Blob | 첨부파일 다운로드 프록시가 특정 Blob host만 허용하게 할 때 씁니다. |

## Neon 연결 문자열 선택

Neon은 보통 두 종류의 연결 문자열을 제공합니다.

| 종류 | 언제 쓰나요? |
| --- | --- |
| Direct connection | Prisma `db push`, migration, schema 작업처럼 데이터베이스 구조를 바꾸는 명령 |
| Pooled connection | Vercel 같은 serverless 환경에서 앱이 많은 짧은 연결을 만들 때 |

이 repo는 현재 `DATABASE_URL` 하나를 씁니다. 처음 schema를 만들 때는 direct connection을 `apps/admin/.env.local`에 넣고 `npm run admin:db:push`를 실행하는 편이 안전합니다. 배포된 관리자 앱에서는 Neon의 pooled connection을 쓰는 구성이 유리할 수 있습니다.

공식 참고:

- [Neon connection strings](https://neon.com/docs/connect/connect-from-any-app)
- [Neon connection pooling](https://neon.com/docs/connect/connection-pooling)
- [Neon with Prisma](https://neon.com/docs/guides/prisma)

## 캐시 재검증 secret 맞추기

`SITE_REVALIDATE_SECRET`은 두 곳에서 같은 값이어야 합니다.

```text
apps/admin/.env.local
apps/site/.env.local
Vercel apps/admin project
Vercel apps/site project
```

역할:

- 관리자 앱은 저장 후 `SITE_REVALIDATE_URL`로 요청을 보냅니다.
- 공개 사이트는 `SITE_REVALIDATE_SECRET`이 맞을 때만 캐시를 새로고침합니다.

값이 다르면 관리자에서 저장해도 공개 사이트가 바로 갱신되지 않을 수 있습니다.

## Vercel 프로젝트별 필수값

관리자 콘솔 프로젝트 (`apps/admin`):

```text
DATABASE_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
BLOB_READ_WRITE_TOKEN
NEXT_PUBLIC_SITE_URL
SITE_REVALIDATE_URL
SITE_REVALIDATE_SECRET
```

공개 사이트 프로젝트 (`apps/site`):

```text
NEXT_PUBLIC_SITE_URL
SITE_ADMIN_API_URL
SITE_REVALIDATE_SECRET
GOOGLE_SITE_VERIFICATION
NAVER_SITE_VERIFICATION
SITE_ATTACHMENT_BLOB_HOST
```

선택값은 비워둘 수 있지만, 첨부파일 업로드나 검색엔진 인증처럼 해당 기능을 쓰려면 채워야 합니다.

## AI가 지켜야 할 말하기 규칙

좋은 설명:

```text
`DATABASE_URL`은 Neon 데이터 금고의 주소와 열쇠가 합쳐진 값입니다. 채팅에 붙여넣지 말고 `apps/admin/.env.local`에 직접 넣어 주세요.
```

나쁜 설명:

```text
DATABASE_URL 값을 여기에 보내 주세요. 제가 넣겠습니다.
```

비밀값을 다룰 때 AI는 값 자체를 보지 않아도 됩니다. 사용자가 값을 넣은 뒤, AI는 앱 실행이나 배포 결과로 연결이 맞는지 확인하면 됩니다.

