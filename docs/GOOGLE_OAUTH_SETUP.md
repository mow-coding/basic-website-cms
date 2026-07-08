# Google OAuth 설정

Google OAuth는 관리자 콘솔의 출입증입니다. 관리자 콘솔은 Google에게 "이 사람이 로그인해도 되는 사람인가요?"라고 묻고, Google이 확인해 주면 관리자 화면으로 들여보냅니다.

이 단계는 사용자가 Google Cloud Console 화면에서 직접 해야 하는 일이 많습니다. AI는 옆에서 안내하고, 값의 의미와 위치를 설명합니다.

공식 참고:

- [Google OAuth web server applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google OAuth clients help](https://support.google.com/cloud/answer/15549257)
- [Google Sign-In server-side flow](https://developers.google.com/identity/sign-in/web/server-side-flow)
- [OAuth 2.0 policies](https://developers.google.com/identity/protocols/oauth2/policies)

## 1. 먼저 알아둘 것

Basic Website CMS의 관리자 앱은 NextAuth와 Google provider를 사용합니다.

필요한 값:

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `NEXTAUTH_URL`

이 중 `GOOGLE_OAUTH_CLIENT_SECRET`은 비밀값입니다. AI 채팅에 붙여넣지 마세요.

## 2. Google Cloud 프로젝트 만들기

사용자가 직접 합니다.

1. [Google Cloud Console](https://console.cloud.google.com/)을 엽니다.
2. 상단 프로젝트 선택 메뉴를 엽니다.
3. 새 프로젝트를 만들거나 기존 프로젝트를 선택합니다.
4. 프로젝트 이름은 사이트 이름을 알아볼 수 있게 정합니다.

예:

```text
basic-website-cms
my-organization-website
```

## 3. OAuth 동의 화면 설정

Google Cloud Console에서 OAuth 동의 화면을 설정합니다.

AI가 쉬운 말로 설명할 내용:

```text
OAuth 동의 화면은 사용자가 Google 로그인 버튼을 눌렀을 때 보게 되는 안내문입니다. 어떤 앱이 로그인을 요청하는지 보여주는 이름표 같은 것입니다.
```

대표 입력값:

| 항목 | 추천 |
| --- | --- |
| App name | 사이트 또는 조직 이름 |
| User support email | 사용자가 문의할 수 있는 이메일 |
| Audience / User type | 개인/소규모 사이트면 External, Google Workspace 내부용이면 Internal |
| Developer contact information | 관리자 이메일 |

처음 테스트 단계에서는 불필요한 Google API scope를 추가하지 않습니다. 이 키트의 기본 로그인은 사용자의 Google 계정으로 관리자 여부를 확인하기 위한 것이므로, 추가 Google Drive/Gmail 권한을 요청하지 않습니다.

## 4. 테스트 사용자 추가

External 테스트 상태라면 Google이 허용한 테스트 사용자만 로그인할 수 있습니다.

사용자가 직접 할 일:

1. OAuth 동의 화면의 테스트 사용자 섹션을 찾습니다.
2. 관리자 로그인에 사용할 Google 이메일을 추가합니다.
3. 저장합니다.

예:

```text
admin@example.com
owner@example.com
```

이 이메일은 코드의 관리자 허용 이메일과도 맞아야 합니다. 기본 허용 이메일은 `apps/admin/lib/site-admin/allowed-users.ts`와 seed 파일에서 확인할 수 있습니다.

## 5. OAuth Client ID 만들기

Google Cloud Console에서 Credentials 또는 Clients 화면으로 갑니다.

사용자가 직접 할 일:

1. Create credentials 또는 Create client를 누릅니다.
2. Application type은 `Web application`을 선택합니다.
3. 이름을 입력합니다.

추천 이름:

```text
Basic Website CMS Admin
```

## 6. Authorized JavaScript origins

JavaScript origin은 "관리자 앱이 열리는 기본 주소"입니다. 경로를 넣지 않습니다.

로컬:

```text
http://localhost:3001
```

배포:

```text
https://YOUR_ADMIN_DOMAIN
```

주의:

- 뒤에 `/signin`을 붙이지 않습니다.
- 뒤에 `/api/auth/callback/google`을 붙이지 않습니다.
- 배포 주소는 관리자 콘솔 Vercel 프로젝트 주소입니다. 공개 사이트 주소가 아닙니다.

## 7. Authorized redirect URIs

Redirect URI는 "Google 로그인이 끝난 뒤 돌아올 주소"입니다.

로컬:

```text
http://localhost:3001/api/auth/callback/google
```

배포:

```text
https://YOUR_ADMIN_DOMAIN/api/auth/callback/google
```

주의:

- 관리자 콘솔 도메인을 씁니다.
- 공개 사이트 도메인을 쓰지 않습니다.
- `http://localhost:3001`은 로컬 개발에서만 씁니다.
- 배포 주소는 HTTPS여야 합니다.

## 8. Client ID와 Client Secret 넣기

Google이 OAuth Client를 만들면 아래 값을 보여줍니다.

- Client ID
- Client Secret

넣을 위치:

| 값 | 로컬 위치 | 배포 위치 |
| --- | --- | --- |
| Client ID | `apps/admin/.env.local`의 `GOOGLE_OAUTH_CLIENT_ID` | Vercel `apps/admin` 프로젝트 environment variables |
| Client Secret | `apps/admin/.env.local`의 `GOOGLE_OAUTH_CLIENT_SECRET` | Vercel `apps/admin` 프로젝트 environment variables |

Client Secret은 채팅에 붙여넣지 않습니다.

## 9. NEXTAUTH_URL 확인

로컬:

```text
NEXTAUTH_URL="http://localhost:3001"
```

배포:

```text
NEXTAUTH_URL="https://YOUR_ADMIN_DOMAIN"
```

`NEXTAUTH_URL`과 Google OAuth의 redirect URI가 서로 맞아야 합니다.

## 10. 로컬 확인

관리자 앱을 다시 시작합니다.

```powershell
npm run admin:dev
```

확인:

1. `http://localhost:3001/signin`을 엽니다.
2. `Google 계정으로 로그인`을 누릅니다.
3. Google 로그인 화면으로 이동하는지 확인합니다.
4. 허용된 관리자 이메일로 로그인합니다.
5. `/site-admin`으로 들어가는지 확인합니다.

## 11. 배포 확인

Vercel 관리자 프로젝트에 환경변수를 넣고 다시 배포합니다.

확인:

1. `https://YOUR_ADMIN_DOMAIN/signin`을 엽니다.
2. Google 로그인 버튼을 누릅니다.
3. Google 로그인 후 관리자 화면으로 돌아오는지 확인합니다.
4. redirect URI mismatch 오류가 없다면 기본 설정은 맞습니다.

## 자주 나는 오류

### redirect_uri_mismatch

뜻:

```text
Google Cloud Console에 등록한 redirect URI와 앱이 요청한 redirect URI가 다릅니다.
```

확인할 것:

- `NEXTAUTH_URL`이 관리자 도메인인지
- Google OAuth Client의 Authorized redirect URI가 정확한지
- `http`와 `https`를 섞지 않았는지
- 공개 사이트 도메인을 넣은 것은 아닌지

### Access blocked 또는 테스트 사용자 오류

확인할 것:

- OAuth 동의 화면이 Testing 상태인지
- 로그인하려는 Google 이메일이 테스트 사용자에 들어 있는지
- 관리자 허용 이메일 목록에 해당 이메일이 들어 있는지

### Google 로그인을 사용할 수 없습니다

뜻:

```text
운영 환경에서 Google OAuth Client ID 또는 Client Secret이 빠졌습니다.
```

확인할 것:

- Vercel `apps/admin` 프로젝트에 `GOOGLE_OAUTH_CLIENT_ID`가 있는지
- Vercel `apps/admin` 프로젝트에 `GOOGLE_OAUTH_CLIENT_SECRET`이 있는지
- 배포 후 새 deployment가 만들어졌는지

## AI가 하면 안 되는 것

- Client Secret을 채팅에 붙여넣으라고 요구하지 않습니다.
- 사용자의 Google 계정 비밀번호를 묻지 않습니다.
- 임의로 Google API scope를 추가하지 않습니다.
- redirect URI를 공개 사이트 도메인으로 추측하지 않습니다.
- 실제 로그인 확인 없이 OAuth 완료라고 말하지 않습니다.

