# Deployment And CI/CD

## Source Of Truth

The normal release path is GitHub-driven:

- Repository: `https://github.com/ianvu17/hanfirstbirthday`
- Remote name: `origin`
- Production branch: `main`
- Vercel scope/project: `ianalysed/hanfirstbirthday`

Native Vercel Git integration should create deployments from GitHub commits. GitHub Actions is reserved for quality gates and live validation. It should not run `vercel deploy` during normal CI.

Local Vercel CLI deployments are deprecated as the regular release path. Keep the CLI for diagnostics, environment inspection, preview troubleshooting, or an explicitly approved emergency fallback.

## GitHub Actions

`.github/workflows/ci.yml` runs on pull requests to `main`, pushes to `main`, and manual dispatch.

The CI job:

- checks out the repository
- installs with `npm ci`
- runs `npm run validate`

`npm run validate` covers content validation, TypeScript, linting, unit/runtime tests, static Supabase migration checks, and a production build. It does not require hosted Supabase credentials, Vercel credentials, production secrets, or browser realtime access.

`.github/workflows/live-validation.yml` is manual-only. It is for hosted Supabase preview validation after secrets are configured in the GitHub `preview-validation` Environment. It must stay out of automatic PR and push triggers because it touches hosted test data.

Required `preview-validation` Environment secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HOST_PIN_HASH`
- `HOST_SESSION_SECRET`

Required or recommended `preview-validation` Environment variables:

- `NEXT_PUBLIC_APP_URL`
- `PARTY_JOIN_CODE`
- `LIVE_REALTIME_JOIN_CODE`

The workflow forces `PARTY_SESSION_IS_TEST=true`. Do not point it at event production data.

## Vercel Git Integration

Connect the existing Vercel project, not a new import:

- Scope/team: `ianalysed`
- Project: `hanfirstbirthday`
- Repository: `ianvu17/hanfirstbirthday`
- Production Branch: `main`, after production environment setup is approved

Expected behavior after connection:

- feature branches and pull requests create Preview Deployments
- pushes or merges to `main` create Production Deployments only when production setup is intentionally activated
- Vercel posts commit or PR deployment status when the GitHub App has repository access

If connecting GitHub would immediately deploy `main` to Production before production environment variables are reviewed, use a temporary production-branch guard or pause connection until Ian approves the production setup.

## Environment Separation

Preview should keep:

- `PARTY_SESSION_IS_TEST=true`
- preview-safe `NEXT_PUBLIC_APP_URL` or Vercel URL fallback
- preview/test join code
- preview-safe Host PIN hash and host session secret

Production must be reviewed before activation:

- `NEXT_PUBLIC_SUPABASE_URL`: may point to the same Supabase project only if test and production data separation is understood
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: browser-safe public key
- `SUPABASE_SERVICE_ROLE_KEY`: server-only
- `NEXT_PUBLIC_APP_URL`: final production origin
- `PARTY_JOIN_CODE`: final event join code
- `PARTY_SESSION_IS_TEST=false`: only after Ian approves the real event session
- `HOST_PIN_HASH`: reviewed event Host PIN hash
- `HOST_SESSION_SECRET`: independent production signing secret

Never copy preview-only join codes, preview origins, local URLs, raw Host PINs, or temporary validation values into Production by default.

## Safe Release Flow

1. Create a feature branch locally.
2. Commit scoped changes.
3. Push the feature branch to GitHub.
4. Confirm GitHub CI passes.
5. Confirm Vercel creates a Preview Deployment from the GitHub commit.
6. Run manual hosted live validation only when preview secrets and test isolation are ready.
7. Open a pull request into `main`.
8. Merge only after CI and the intended Vercel preview status pass.
9. Allow `main` Production deployment only after production environment review is complete.

## Rollback

Preferred rollback options:

- revert the bad commit on `main`
- redeploy a previous verified Vercel deployment
- intentionally promote a verified preview only when Ian approves that action

Do not fix production by editing untracked local files and running an undocumented local CLI deployment.

## Emergency Manual Deployment Policy

Manual `npx vercel deploy` may be used only when GitHub-driven deployment is unavailable and Ian explicitly approves the reason, target, and environment. Do not run `vercel --prod` without explicit approval.
