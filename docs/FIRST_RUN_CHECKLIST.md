# 첫 실행 체크리스트

이 문서는 Basic Website CMS를 처음 받은 사용자의 AI가 처음부터 끝까지 따라갈 작업 순서입니다.

목표는 "명령어를 많이 아는 사람"을 만드는 것이 아니라, 사용자가 자기 웹사이트가 어떤 부품으로 조립되는지 이해하면서 실제로 로컬 실행과 배포까지 가게 돕는 것입니다.

## 0. 시작 전에 설명할 것

AI는 명령어를 실행하기 전에 아래 네 가지를 먼저 쉬운 말로 설명합니다.

| 부품 | 쉬운 설명 |
| --- | --- |
| GitHub | 코드 창고입니다. 프로젝트 코드와 변경 기록을 보관합니다. |
| Vercel | 포장·배송 센터입니다. GitHub의 코드를 실제 웹사이트로 포장하고 인터넷 주소로 배송합니다. |
| Neon | 데이터 금고입니다. 관리자가 바꾸는 게시글, 일정, 페이지 내용을 저장합니다. |
| GCP / Google OAuth | 관리자 출입증 발급소입니다. 관리자 콘솔을 Google 로그인으로 보호할 출입증을 만듭니다. |

이 단계에서는 `localhost`를 설명하지 않습니다. `localhost`는 로컬 실행 단계에서만 소개합니다.

## 1. 저장소 상태 확인

AI가 먼저 확인합니다.

```powershell
git status --short --branch
git remote -v
```

확인할 것:

- 현재 작업 폴더가 Basic Website CMS인지
- 공개 starter repo에서 작업하는지
- 사용자가 이미 바꾼 파일이 있는지

사용자 파일이 이미 바뀌어 있다면 덮어쓰지 말고 먼저 범위를 설명합니다.

## 2. 로컬 도구 확인

AI가 아래 명령으로 도구 설치 여부를 확인합니다.

```powershell
node --version
npm --version
git --version
gh --version
vercel --version
neonctl --version
gcloud --version
```

필수:

- Node.js 20.9 이상
- npm
- Git
- PostgreSQL 데이터베이스. 처음에는 Neon을 권장합니다.

도움이 되는 도구:

- GitHub CLI (`gh`)
- Vercel CLI
- Neon CLI
- Google Cloud CLI (`gcloud`)

CLI가 없어도 서비스 웹 대시보드로 진행할 수 있습니다. 다만 AI가 상태를 확인하기 쉬우려면 CLI가 있으면 좋습니다.

## 3. 의존성 설치

```powershell
npm --prefix apps/site install
npm --prefix apps/admin install
```

완료 확인:

```powershell
npm run site:typecheck
npm run admin:typecheck
```

## 4. 환경변수 파일 만들기

```powershell
Copy-Item apps/site/.env.example apps/site/.env.local
Copy-Item apps/admin/.env.example apps/admin/.env.local
```

macOS/Linux라면:

```bash
cp apps/site/.env.example apps/site/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```

이후 [환경변수 안내](ENVIRONMENT_VARIABLES.md)를 보고 값을 채웁니다.

중요:

- 비밀값을 AI 채팅에 붙여넣지 않습니다.
- AI는 변수 이름과 넣을 위치를 설명합니다.
- 사용자는 `.env.local` 또는 Vercel 환경변수 화면에 직접 값을 넣습니다.

## 5. Neon 데이터베이스 준비

초심자에게는 Neon을 "관리자가 바꾸는 내용을 저장하는 데이터 금고"라고 설명합니다.

권장 흐름:

1. Neon 계정을 만들고 로그인합니다.
2. 새 프로젝트와 데이터베이스를 만듭니다.
3. 연결 문자열을 복사합니다.
4. `apps/admin/.env.local`의 `DATABASE_URL`에 넣습니다.

Prisma schema 작업에는 Neon의 direct connection string을 쓰는 편이 안전합니다. 운영 앱에서는 pooled connection string이 유리할 수 있습니다. Neon은 pooled connection과 direct connection을 구분하므로, AI는 이 차이를 쉬운 말로 설명해야 합니다.

공식 참고:

- [Neon connection strings](https://neon.com/docs/connect/connect-from-any-app)
- [Neon connection pooling](https://neon.com/docs/connect/connection-pooling)
- [Neon with Prisma](https://neon.com/docs/guides/prisma)

## 6. 관리자 데이터베이스 초기화

환경변수를 채운 뒤 실행합니다.

```powershell
npm run admin:db:push
npm run admin:seed
npm run admin:seed:sample
```

역할:

- `admin:db:push`: Neon 데이터 금고에 필요한 칸 구조를 만듭니다.
- `admin:seed`: 기본 관리자 계정 정보를 넣습니다.
- `admin:seed:sample`: 처음 화면을 확인할 샘플 게시글과 일정을 넣습니다.

## 7. 로컬에서 두 앱 실행

터미널을 두 개 열어 각각 실행합니다.

터미널 1:

```powershell
npm run admin:dev
```

터미널 2:

```powershell
npm run site:dev
```

기본 주소:

- 공개 사이트: `http://localhost:3000`
- 관리자 콘솔: `http://localhost:3001`

`localhost`는 내 컴퓨터 안에서만 열리는 임시 웹사이트 주소입니다. Vercel이 인터넷에 배송하기 전에 미리 확인할 때 씁니다.

## 8. Google OAuth 준비

관리자 앱은 Google OAuth 설정 전에도 배포할 수 있습니다. 이때 로그인 화면에는 설정 필요 안내가 보입니다. 실제 관리자 로그인을 확인하려면 Google OAuth를 먼저 설정합니다. 공개 스타터는 우회 로그인으로 관리자 콘솔을 열지 않습니다.

자세한 단계는 [Google OAuth 설정](GOOGLE_OAUTH_SETUP.md)을 따릅니다.

사용자가 직접 해야 하는 일:

- Google Cloud Console에서 프로젝트 선택
- OAuth 동의 화면 설정
- 웹 애플리케이션 OAuth Client ID 생성
- redirect URI와 JavaScript origin 등록
- Client ID와 Client Secret을 `.env.local`과 Vercel 환경변수에 입력

## 9. Vercel 프로젝트 만들기

Vercel에서는 같은 GitHub 저장소에서 프로젝트를 두 개 만듭니다.

| Vercel 프로젝트 | Root Directory |
| --- | --- |
| 공개 사이트 | `apps/site` |
| 관리자 콘솔 | `apps/admin` |

Vercel 환경변수는 두 프로젝트에 다르게 들어갑니다. 자세한 매핑은 [환경변수 안내](ENVIRONMENT_VARIABLES.md)를 따릅니다.

공식 참고:

- [Vercel CLI](https://vercel.com/docs/cli)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Vercel env CLI](https://vercel.com/docs/cli/env)

## 10. 배포 후 검증

배포만 하고 끝내지 않습니다. [배포 검증 체크리스트](DEPLOYMENT_VERIFICATION.md)를 따라 실제 동작을 확인합니다.

최소 확인:

- 공개 사이트 production URL이 200으로 응답
- 관리자 로그인 URL이 200으로 응답
- Google 로그인이 정상 동작
- 관리자에서 게시글 또는 일정 저장
- 공개 사이트에 변경 반영
- 첨부파일을 쓴다면 업로드와 다운로드 확인

## 11. 안전한 커스터마이즈 시작

처음에는 아래만 바꿉니다.

- 사이트 이름
- 조직 이름
- 로고
- 브랜드 색상
- 메뉴 이름
- 샘플 게시글
- 샘플 일정
- 이미지
- SEO 제목과 설명

실제 파일과 작업 예시는 [안전한 커스터마이즈 레시피](SAFE_CUSTOMIZATION_RECIPES.md)를 따릅니다.

인증, 데이터베이스 schema, 업로드 보안, HTML sanitize, 캐시 재검증 secret 흐름은 보호 영역입니다.
