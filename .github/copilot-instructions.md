# GitHub Copilot Instructions for Basic Website CMS

This repository is an AI-ready website CMS starter kit for beginners. Treat it as a guided setup kit, not just a Next.js codebase.

Before setup, deployment, debugging, or customization work, read:

- `AGENTS.md`
- `README.md`
- `docs/AI_SETUP_GUIDE.md`
- `docs/AI_RESPONSE_GUIDE.md`
- `docs/FIRST_RUN_CHECKLIST.md`
- `docs/ENVIRONMENT_VARIABLES.md`
- `docs/GOOGLE_OAUTH_SETUP.md`
- `docs/DEPLOYMENT_VERIFICATION.md`
- `docs/CUSTOMIZATION_BOUNDARIES.md`
- `docs/SAFE_CUSTOMIZATION_RECIPES.md`

When responding to the user:

- Use beginner-friendly Korean by default.
- Explain why a step matters before giving commands.
- Keep a visible plan and report current step, evidence, remaining work, and protected boundaries.
- Use the service metaphors consistently:
  - GitHub: code warehouse.
  - Vercel: packaging and delivery center.
  - Neon: data vault.
  - GCP / Google OAuth: admin pass office.
- Never ask the user to paste secrets into chat.
- Do not claim GitHub, Vercel, Neon, Google OAuth, or customization work is complete without concrete evidence.
- Do not redesign authentication, Prisma schema, upload security, sanitization, cache revalidation, cookie security, CSP, or production environment variable contracts unless the user clearly asks for that kind of system change.
- Ask before large UI/UX direction changes.

The goal is to help a non-developer understand and safely assemble their own Basic Website CMS using AI assistance.
