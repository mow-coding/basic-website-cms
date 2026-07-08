# 안전한 커스터마이즈 레시피

이 문서는 Basic Website CMS를 자기 사이트로 바꿀 때 먼저 시도하기 좋은 작업을 정리합니다.

원칙:

- 먼저 문구, 이미지, 색상, 메뉴, 샘플 콘텐츠를 바꿉니다.
- 인증, 데이터베이스 schema, 업로드 보안, HTML sanitize, 캐시 재검증 secret 흐름은 보호합니다.
- 큰 UI/UX 변경 전에는 사용자의 의도를 확인합니다.

## 1. 사이트 이름 바꾸기

주로 볼 파일:

```text
apps/site/src/lib/site-data.ts
apps/site/src/components/site-header.tsx
apps/site/src/components/site-footer.tsx
apps/site/src/app/layout.tsx
apps/admin/app/layout.tsx
```

바꿔도 되는 것:

- 사이트 이름
- 조직 이름
- 메인 설명 문구
- 이메일 표시
- SEO title과 description

주의:

- `NEXT_PUBLIC_SITE_URL`은 환경변수에서 바꿉니다.
- 인증 callback 주소는 Google OAuth 설정에서 따로 바꿉니다.

## 2. 관리자 이메일 바꾸기

주로 볼 파일:

```text
apps/admin/lib/site-admin/allowed-users.ts
apps/admin/scripts/seed-site-admin.mjs
apps/admin/scripts/seed-sample-content.mjs
```

바꿀 것:

- 기본 관리자 이메일
- 관리자 표시 이름
- 샘플 콘텐츠 작성자 이메일

주의:

- Google OAuth 테스트 사용자에도 같은 이메일을 넣어야 합니다.
- 실제 운영에서는 허용 이메일 목록을 조직 기준으로 다시 확인합니다.

## 3. 샘플 콘텐츠 바꾸기

주로 볼 파일:

```text
apps/admin/scripts/seed-sample-content.mjs
apps/site/src/lib/site-data.ts
```

역할:

- `seed-sample-content.mjs`: 데이터베이스에 넣을 샘플 게시글과 일정
- `site-data.ts`: 관리자 API가 아직 연결되지 않았을 때 공개 사이트가 보여주는 정적 샘플

주의:

- 두 파일의 샘플 게시글과 일정은 서로 맞아야 합니다.
- 제목, 날짜, slug를 바꿀 때 공개 사이트 링크가 깨지지 않는지 확인합니다.

실행:

```powershell
npm run admin:seed:sample
```

## 4. 메뉴 이름 바꾸기

주로 볼 파일:

```text
apps/site/src/components/site-header.tsx
apps/site/src/components/site-footer.tsx
apps/site/src/app/page.tsx
```

바꿔도 되는 것:

- 상단 메뉴 라벨
- 하위 메뉴 라벨
- 푸터 문구
- 홈 화면 섹션 제목

주의:

- 링크 경로를 바꾸면 해당 페이지가 실제로 있는지 확인합니다.
- 메뉴 구조를 크게 바꾸면 모바일 메뉴도 함께 확인합니다.

## 5. 이미지 바꾸기

주로 볼 폴더:

```text
apps/site/public/
```

바꿔도 되는 것:

- 대표 이미지
- 프로그램 카드 이미지
- 로고와 아이콘
- OG 이미지

주의:

- 같은 파일명으로 교체하면 코드 수정이 적습니다.
- 파일 크기가 너무 크면 페이지가 느려질 수 있습니다.
- 실제 기관이나 인물 사진을 쓸 때는 사용 권한을 확인합니다.

이미지 출처 기록:

```text
CREDITS.md
```

## 6. 브랜드 색상 바꾸기

주로 볼 파일:

```text
apps/site/src/app/globals.css
apps/site/src/app/design-refresh.css
apps/admin/app/globals.css
```

주의:

- 색상만 바꾸는 것과 레이아웃을 바꾸는 것은 다릅니다.
- 텍스트 대비가 너무 낮아지지 않게 확인합니다.
- 버튼, 링크, 입력창, 달력 상태 색상을 같이 확인합니다.

검증:

```powershell
npm run site:lint
npm run admin:lint
npm run site:build
npm run admin:build
```

## 7. 개인정보처리방침 바꾸기

주로 볼 파일:

```text
apps/site/src/app/privacy/page.tsx
```

바꿔야 할 수 있는 것:

- 조직 이름
- 문의 이메일
- 사용하는 외부 폼 또는 저장소
- 개인정보 보유 기간

주의:

- 법률 문구는 실제 운영 상황과 맞아야 합니다.
- 민감한 업종이라면 전문가 검토가 필요할 수 있습니다.

## 8. 검색엔진 인증값 넣기

환경변수:

```text
GOOGLE_SITE_VERIFICATION
NAVER_SITE_VERIFICATION
```

넣을 곳:

- 로컬 확인: `apps/site/.env.local`
- 배포: Vercel `apps/site` 프로젝트 environment variables

코드에서 읽는 곳:

```text
apps/site/src/app/layout.tsx
```

## 9. 보호된 영역

아래는 사용자가 명확히 요청하고 위험을 이해한 경우가 아니라면 바꾸지 않습니다.

```text
apps/admin/prisma/schema.prisma
apps/admin/lib/auth.ts
apps/admin/app/api/auth/[...nextauth]/route.ts
apps/admin/lib/site-admin/sanitize.ts
apps/admin/lib/site-admin/upload-policy.ts
apps/site/src/app/api/revalidate/route.ts
apps/site/src/app/api/attachments/download/route.ts
```

이 파일들은 인증, 데이터베이스 구조, 업로드 보안, HTML sanitize, 캐시 재검증과 관련됩니다.

## 10. 안전한 작업 순서

1. 바꾸려는 목표를 한 문장으로 적습니다.
2. 바꿀 파일 목록을 확인합니다.
3. 문구/이미지/색상 변경인지, 시스템 구조 변경인지 구분합니다.
4. 작은 변경만 합니다.
5. typecheck, lint, build를 실행합니다.
6. 로컬에서 화면을 확인합니다.
7. 배포 후 실제 URL을 확인합니다.

AI는 최종 보고에 "보호된 영역을 건드렸는지"를 반드시 적습니다.

