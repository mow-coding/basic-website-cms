# AI에게 붙여넣을 프롬프트

Claude, Codex 같은 AI 코딩 도우미에게 이 저장소를 맡길 때 아래 프롬프트를 복사해 붙여넣으세요.

```text
나는 Basic Website CMS를 AI와 함께 설치하고 배포하는 웹사이트 CMS 키트로 사용하고 싶다.

먼저 아래 문서를 읽어라.
- AGENTS.md
- CLAUDE.md
- GEMINI.md
- .github/copilot-instructions.md
- README.md
- docs/AI_SETUP_GUIDE.md
- docs/AI_RESPONSE_GUIDE.md
- docs/FIRST_RUN_CHECKLIST.md
- docs/ENVIRONMENT_VARIABLES.md
- docs/GOOGLE_OAUTH_SETUP.md
- docs/DEPLOYMENT_VERIFICATION.md
- docs/SERVICE_SETUP_NOTES.md
- docs/CUSTOMIZATION_BOUNDARIES.md
- docs/SAFE_CUSTOMIZATION_RECIPES.md

내 수준:
- 나는 전문 웹개발자가 아니다.
- GitHub, Vercel, Neon, GCP/Google OAuth를 연결하기 전에 각각이 무슨 역할을 하는지 쉬운 말로 설명해라.
- 내가 뭔지 모르는 상태로 대충 넘어가게 하지 마라.
- 의미 있는 단계마다 현재 단계, 사용자가 직접 할 일, 확인 근거, 남은 일을 짧게 보고해라.

제품 목표:
- 이 키트를 내 공개 웹사이트와 관리자 콘솔로 바꾸고 싶다.
- 로컬에서 실행하고 싶다.
- GitHub, Vercel, Neon, Google OAuth를 연결하고 싶다.
- 공개 사이트와 관리자 콘솔을 둘 다 배포하고 싶다.
- 먼저 안전한 영역부터 커스터마이즈하고 싶다.

중요한 경계:
- GitHub는 코드 창고다.
- Vercel은 포장·배송 센터다.
- Neon은 관리자에 의해 바뀔 수 있는 콘텐츠를 저장하는 데이터 금고다.
- GCP/Google OAuth는 관리자 출입증 발급소다.
- 인증, 데이터베이스 스키마, 업로드 보안, HTML sanitize, 캐시 재검증, 환경변수 이름을 함부로 바꾸지 마라.
- 큰 UI/UX 변경 전에는 먼저 물어봐라.
- 비밀값을 채팅에 그대로 붙여넣으라고 요구하지 마라. 가능하면 .env.local이나 Vercel 환경변수에 직접 넣게 안내해라.
- 실제 명령 출력, 배포 상태, live URL 확인 없이 완료됐다고 말하지 마라.
- Google OAuth, 환경변수, 배포 검증, 안전한 커스터마이즈는 위 docs의 전용 체크리스트를 따라 진행해라.

이제 먼저 계획을 세우고, 현재 저장소 상태를 확인하고, 내가 어떤 계정과 도구를 준비해야 하는지 알려줘.
```

## 짧은 버전

```text
이 Basic Website CMS 저장소를 AI-ready 웹사이트 CMS 스타터 키트로 사용하고 싶다. README와 docs를 먼저 읽어라. GitHub, Vercel, Neon, Google OAuth의 역할을 초심자에게 쉬운 말로 설명하고, 각 단계마다 현재 단계와 확인 근거와 남은 일을 보고하면서 로컬 실행, 데이터베이스, 인증, 배포, 안전한 커스터마이즈를 도와줘. 백엔드, 인증, DB 스키마, 업로드 보안, 환경변수 계약은 함부로 바꾸지 마라.
```
