# Basic Website CMS

Basic Website CMS는 작은 조직이 사용할 수 있는 **AI-ready 웹사이트 CMS 스타터 키트**입니다.

이 저장소는 단순히 완성된 웹사이트 껍데기를 전시하기 위한 것이 아닙니다. Claude, Codex 같은 AI 코딩 도우미에게 이 저장소를 맡기면, 초보자도 자기 컴퓨터에서 실행하고 GitHub, Vercel, Neon, Google OAuth를 연결해 실제 웹사이트와 관리자 콘솔을 배포할 수 있도록 돕는 키트입니다.

## 무엇을 만들 수 있나요?

이 키트는 두 개의 Next.js 앱으로 구성됩니다.

- `apps/site`: 방문자가 보는 공개 웹사이트
- `apps/admin`: 믿을 수 있는 관리자가 게시글, 일정, 페이지, 첨부파일을 관리하는 관리자 콘솔

관리자 콘솔에서 내용을 저장하면 공개 웹사이트에 반영됩니다.

중요한 백엔드 설계는 이미 준비되어 있습니다. 이 키트를 사용하는 초심자가 인증, 데이터베이스 구조, 업로드 보안, 캐시 재검증 같은 핵심 구조를 직접 다시 설계할 필요는 없습니다. 대신 이 키트는 **어디까지 자유롭게 바꿔도 되는지**, **어디부터는 조심해야 하는지**를 AI가 잘 안내할 수 있게 만들어야 합니다.

## 네 가지 주요 서비스

웹개발 전문가가 될 필요는 없지만, 이 키트가 어떤 부품으로 조립되는지는 이해하는 것이 좋습니다. 이케아 가구를 조립할 때 드라이버와 나사가 무엇인지 정도는 아는 것과 같습니다.

| 서비스 | 쉬운 설명 |
| --- | --- |
| GitHub | 코드 창고입니다. 프로젝트 코드와 변경 기록을 보관합니다. |
| Vercel | 포장·배송 센터입니다. GitHub의 코드를 실제 웹사이트로 포장하고 인터넷 주소로 배송합니다. |
| Neon | 데이터 금고입니다. 관리자에 의해 바뀔 수 있는 게시글, 일정, 설정을 안전하게 저장합니다. |
| GCP / Google OAuth | 관리자 출입증 발급소입니다. 관리자 콘솔에 Google 로그인으로 들어갈 수 있게 출입증을 만듭니다. |

GitHub, Vercel, Neon은 보통 AI가 CLI 설치와 로그인 흐름을 많이 도와줄 수 있습니다. 반면 Google OAuth 설정은 Google Cloud Console 화면에서 사용자가 직접 클릭하고 값을 입력해야 하는 단계가 많습니다. AI는 옆에서 안내하고 확인하는 역할을 합니다.

## AI와 함께 시작하기

이 키트를 AI 코딩 도우미와 함께 사용한다면 아래 문서부터 읽게 하세요.

- [AI 설정 가이드](docs/AI_SETUP_GUIDE.md)
- [AI 응답 가이드](docs/AI_RESPONSE_GUIDE.md)
- [첫 실행 체크리스트](docs/FIRST_RUN_CHECKLIST.md)
- [환경변수 안내](docs/ENVIRONMENT_VARIABLES.md)
- [Google OAuth 설정](docs/GOOGLE_OAUTH_SETUP.md)
- [배포 검증 체크리스트](docs/DEPLOYMENT_VERIFICATION.md)
- [서비스 설정 노트](docs/SERVICE_SETUP_NOTES.md)
- [커스터마이즈 경계](docs/CUSTOMIZATION_BOUNDARIES.md)
- [안전한 커스터마이즈 레시피](docs/SAFE_CUSTOMIZATION_RECIPES.md)
- [AI에게 붙여넣을 프롬프트](docs/AI_ASSISTANT_PROMPT.md)

추천 흐름은 다음과 같습니다.

1. AI에게 이 저장소와 위 문서들을 먼저 읽게 합니다.
2. AI가 GitHub, Vercel, Neon, Google OAuth의 역할을 쉬운 말로 설명하게 합니다.
3. AI가 현재 단계, 사용자가 직접 할 일, 확인 근거, 남은 일을 보이게 보고하게 합니다.
4. [첫 실행 체크리스트](docs/FIRST_RUN_CHECKLIST.md)에 따라 내 컴퓨터에 필요한 도구가 설치되어 있는지 확인하게 합니다.
5. [환경변수 안내](docs/ENVIRONMENT_VARIABLES.md)를 보며 로컬과 Vercel 환경변수를 채웁니다.
6. AI 안내에 따라 GitHub, Vercel, Neon에 로그인합니다.
7. [Google OAuth 설정](docs/GOOGLE_OAUTH_SETUP.md)은 사용자가 Google Cloud Console에서 직접 만들고, AI가 옆에서 안내합니다.
8. 로컬에서 공개 사이트와 관리자 콘솔을 실행합니다.
9. Vercel에 두 앱을 배포하고 [배포 검증 체크리스트](docs/DEPLOYMENT_VERIFICATION.md)로 확인합니다.
10. 먼저 [안전한 커스터마이즈 레시피](docs/SAFE_CUSTOMIZATION_RECIPES.md)에 있는 문구, 이미지, 색상, 메뉴, 샘플 데이터부터 커스터마이즈합니다.

## 로컬 개발

필요한 것:

- Node.js 20.9 이상
- npm
- PostgreSQL 데이터베이스. 실제 사용에서는 보통 Neon을 씁니다.

의존성 설치:

```bash
npm --prefix apps/site install
npm --prefix apps/admin install
```

환경변수 예시 파일 복사:

```bash
cp apps/site/.env.example apps/site/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```

Windows PowerShell에서는:

```powershell
Copy-Item apps/site/.env.example apps/site/.env.local
Copy-Item apps/admin/.env.example apps/admin/.env.local
```

환경변수를 채운 뒤 관리자 데이터베이스를 준비합니다.

```bash
npm run admin:db:push
npm run admin:seed
npm run admin:seed:sample
```

두 앱 실행:

```bash
npm run admin:dev
npm run site:dev
```

기본 로컬 주소:

- 공개 사이트: `http://localhost:3000`
- 관리자 콘솔: `http://localhost:3001`

`localhost`는 내 컴퓨터 안에서만 열리는 임시 웹사이트 주소입니다. Vercel로 인터넷에 배송하기 전에 화면과 기능을 미리 확인할 때 씁니다.

## 구조

```text
apps/
  site/   공개 웹사이트
  admin/  관리자 콘솔, 데이터베이스 연결, Google 로그인, 콘텐츠 관리
docs/
  AI와 초심자를 위한 설정/커스터마이즈 안내
```

## 배포 구조

Vercel에서는 같은 GitHub 저장소에서 프로젝트를 두 개 만듭니다.

- 공개 사이트 프로젝트: Root Directory를 `apps/site`로 설정
- 관리자 콘솔 프로젝트: Root Directory를 `apps/admin`으로 설정

공개 사이트는 관리자 콘솔의 공개 API에서 콘텐츠를 읽습니다. 관리자 콘솔은 Neon PostgreSQL 데이터베이스를 사용하고, Google OAuth로 관리자 로그인을 보호합니다.

## 라이선스

MIT
