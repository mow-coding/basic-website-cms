# 배포 검증 체크리스트

배포는 "Vercel에 올렸다"에서 끝나지 않습니다. 실제 URL이 열리고, 관리자 로그인과 데이터 저장, 공개 사이트 반영까지 확인해야 완료입니다.

## 1. 배포 대상 확인

Vercel 프로젝트는 두 개입니다.

| 앱 | Root Directory | 역할 |
| --- | --- | --- |
| `apps/site` | `apps/site` | 방문자가 보는 공개 사이트 |
| `apps/admin` | `apps/admin` | 관리자가 콘텐츠를 관리하는 콘솔 |

확인할 것:

- 두 프로젝트 모두 같은 GitHub 저장소를 바라보는지
- 각 프로젝트의 Root Directory가 맞는지
- 배포된 commit이 의도한 commit인지

## 2. Vercel 상태 확인

Vercel dashboard 또는 CLI에서 확인합니다.

CLI 예:

```powershell
vercel whoami
vercel project ls
```

배포 결과에서 확인할 것:

- deployment state가 `READY`인지
- build가 실패하지 않았는지
- production URL이 무엇인지
- 배포된 commit이 최신인지

공식 참고:

- [Vercel CLI](https://vercel.com/docs/cli)
- [Deploying from the CLI](https://vercel.com/docs/projects/deploy-from-cli)
- [Vercel environments](https://vercel.com/docs/deployments/environments)

## 3. 공개 사이트 URL 확인

확인:

```text
https://YOUR_SITE_DOMAIN
```

성공 기준:

- HTTP 200으로 열립니다.
- 메인 페이지가 보입니다.
- 메뉴 이동이 됩니다.
- 게시글과 일정 영역이 보입니다.
- 브라우저 콘솔에 치명적인 오류가 없습니다.

AI가 CLI로 확인할 수 있다면:

```powershell
Invoke-WebRequest https://YOUR_SITE_DOMAIN -UseBasicParsing
```

## 4. 관리자 로그인 URL 확인

확인:

```text
https://YOUR_ADMIN_DOMAIN/signin
```

성공 기준:

- HTTP 200으로 열립니다.
- Google 로그인 버튼이 보입니다.
- Google OAuth 설정이 완료되어 있어야 관리자 로그인을 시작할 수 있습니다.
- 버튼을 누르면 Google 로그인 화면으로 이동합니다.

## 5. Google OAuth 확인

성공 기준:

- 허용된 관리자 Google 계정으로 로그인됩니다.
- 로그인 후 `/site-admin`으로 이동합니다.
- 허용되지 않은 이메일은 관리자 접근이 막힙니다.

오류가 나면 [Google OAuth 설정](GOOGLE_OAUTH_SETUP.md)의 자주 나는 오류를 확인합니다.

## 6. Neon 데이터베이스 확인

성공 기준:

- 관리자 화면이 데이터베이스 오류 없이 열립니다.
- 게시글 목록, 일정 목록이 로드됩니다.
- 새 게시글 또는 일정 저장이 됩니다.

자주 나는 원인:

- `DATABASE_URL`이 빠짐
- pooled/direct connection string을 잘못 사용함
- `npm run admin:db:push`를 실행하지 않음
- Vercel 관리자 프로젝트에 환경변수를 넣지 않음

## 7. 공개 사이트 반영 확인

관리자에서 작은 테스트를 합니다.

1. 관리자에서 테스트 게시글을 하나 만듭니다.
2. 공개 상태로 저장합니다.
3. 공개 사이트에서 게시글이 보이는지 확인합니다.
4. 필요하면 새로고침 후 다시 확인합니다.

확인할 환경변수:

- 관리자 프로젝트의 `SITE_REVALIDATE_URL`
- 관리자 프로젝트의 `SITE_REVALIDATE_SECRET`
- 공개 사이트 프로젝트의 `SITE_REVALIDATE_SECRET`
- 공개 사이트 프로젝트의 `SITE_ADMIN_API_URL`

`SITE_REVALIDATE_SECRET`은 관리자와 공개 사이트 양쪽 값이 같아야 합니다.

## 8. 첨부파일 확인

첨부파일 기능을 쓴다면 확인합니다.

성공 기준:

- 관리자에서 파일 업로드가 됩니다.
- 공개 사이트에서 첨부파일 링크가 보입니다.
- 다운로드가 됩니다.

확인할 환경변수:

- 관리자 프로젝트의 `BLOB_READ_WRITE_TOKEN`
- 공개 사이트 프로젝트의 `SITE_ATTACHMENT_BLOB_HOST`

`SITE_ATTACHMENT_BLOB_HOST`는 선택값입니다. 특정 Vercel Blob host만 허용하고 싶을 때 씁니다.

## 9. 최종 보고 형식

AI는 배포 확인 후 이렇게 보고합니다.

```text
완료된 일:
- 공개 사이트 배포 확인
- 관리자 콘솔 배포 확인
- Google 로그인 확인
- 관리자 저장 후 공개 사이트 반영 확인

확인 근거:
- site URL: 200
- admin signin URL: 200
- Vercel deployment: READY
- 확인한 commit: <commit>

남은 일:
- 예: 커스텀 도메인 연결, 검색엔진 인증, 실제 이미지 교체

보호 경계:
- 인증 흐름, Prisma schema, 업로드 보안, HTML sanitize, 환경변수 이름은 바꾸지 않음
```

## 완료라고 말하면 안 되는 경우

- Vercel build만 성공했고 실제 URL을 열어보지 않은 경우
- 공개 사이트만 확인하고 관리자 로그인을 확인하지 않은 경우
- Google OAuth가 redirect 오류를 내는 경우
- 관리자 저장은 됐지만 공개 사이트 반영을 확인하지 않은 경우
- 비밀값이 어느 Vercel 프로젝트에 들어갔는지 모르는 경우

이때는 "완료"가 아니라 "배포는 되었고, 아직 로그인 확인이 남았습니다"처럼 말합니다.
