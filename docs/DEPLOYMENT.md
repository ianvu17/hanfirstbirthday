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

The workflow forces `PARTY_SESSION_IS_TEST=true`. Use validation-owned join codes so cleanup cannot affect event rows.

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

### Production-Safe Connection Checklist

Before connecting GitHub to Vercel:

1. Open Vercel Dashboard with the `ianalysed` team selected.
2. Open the existing `hanfirstbirthday` project.
3. Confirm Preview environment variables are present and Production environment variables have not been populated by copying preview values.
4. Choose one production guard:
   - configure reviewed Production environment variables first, or
   - set Vercel's Production Branch to a temporary branch that will not receive normal work, then switch it back to `main` after production approval.
5. Install or authorize the Vercel GitHub App for only `ianvu17/hanfirstbirthday`.
6. Connect the existing Vercel project to the GitHub repository from the Vercel project settings. Do not import the repository as a new project.
7. Verify the connected repository is exactly `ianvu17/hanfirstbirthday`.
8. Verify no duplicate `hanfirstbirthday` project was created under `ianalysed`.
9. Push a non-main test branch to confirm a Preview Deployment and GitHub deployment status.
10. Switch Production Branch to `main` only after Ian approves production environment setup and final activation.

Do not run `vercel git connect` from the CLI unless the production guard has already been confirmed in Vercel. The CLI connection command does not expose enough production-branch controls in this repository to make the first connection safely non-production.

### Post-Connection Verification

After Git integration is connected, verify:

- Vercel project API or dashboard shows a Git link to `ianvu17/hanfirstbirthday`.
- A push to a feature branch creates a Preview Deployment, not Production.
- A pull request into `main` shows GitHub CI and Vercel preview status.
- The Vercel deployment metadata includes the GitHub commit SHA.
- Preview deployment uses `PARTY_SESSION_IS_TEST=true`.
- Production deployment is still guarded or intentionally configured.
- `/api/party/session` on Preview reports remote mode, `isTest=true`, and a non-localhost join URL.

Current verified state on July 13, 2026:

- Vercel project `ianalysed/hanfirstbirthday` is connected to GitHub repository `ianvu17/hanfirstbirthday`.
- Production Branch is `main`.
- Smoke branch `ci/vercel-git-smoke` created a Git-triggered Preview Deployment at `https://hanfirstbirthday-f5wol7z9g-ianalysed.vercel.app`.
- Preview deployment metadata references Git SHA `f53120ddb141226f43a2ff84eb8822c65a984e3e` and PR `#1`.
- Preview routes `/en` and `/display/party` returned HTTP 200.
- Preview `/api/party/session` returned remote mode with `isTest=true`.
- GitHub PR `#1` is open, clean, and intentionally unmerged until Production environment variables are reviewed.
- Vercel Production environment variables are configured. `HOST_SESSION_SECRET` is separated between Production and Preview. `HOST_PIN_HASH` may remain shared for this project. `PARTY_SESSION_IS_TEST=true` in Production is supported because it only selects the default test-tagged session row.
- GitHub ruleset `feature_branch_protection` is active for the default branch, blocks direct deletion/force-pushes, requires pull requests, and requires the `Validate` status check before merge.

## Environment Separation

### Preview

Preview should keep:

- `PARTY_SESSION_IS_TEST=true`
- preview-safe `NEXT_PUBLIC_APP_URL` or Vercel URL fallback
- preview/test join code
- preview-safe Host PIN hash and host session secret

### Production

Production means the app can be deployed from `main` to the stable Vercel Production target. Production with `PARTY_SESSION_IS_TEST=true` is normal and supported; that variable is only the default session selector.

- Production deploys are enabled.
- `NEXT_PUBLIC_APP_URL`: stable production origin.
- `PARTY_SESSION_IS_TEST=true`: production-origin data uses the test-tagged default session.
- `HOST_SESSION_SECRET`: independent Production signing secret.
- `HOST_PIN_HASH`: may remain shared with Preview for this project.
- `PARTY_JOIN_CODE`: production join code.

Production environment variables must be reviewed before Production Deployment:

- `NEXT_PUBLIC_SUPABASE_URL`: may point to the same Supabase project only if data separation is understood
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: browser-safe public key
- `SUPABASE_SERVICE_ROLE_KEY`: server-only
- `NEXT_PUBLIC_APP_URL`: stable production origin
- `PARTY_JOIN_CODE`: production join code
- `PARTY_SESSION_IS_TEST=true`: supported production default session selector
- `HOST_PIN_HASH`: reviewed event Host PIN hash
- `HOST_SESSION_SECRET`: independent production signing secret

Never copy preview-only join codes, preview origins, local URLs, raw Host PINs, or temporary validation values into Production by default.

### Physical Rehearsal

Physical rehearsal is the human/device approval step for the party setup:

- Stable production origin and QR code have been verified.
- Laptop or TV display, host device, and guest phones have been tested together.
- Event Host PIN and host session behavior have been tested end to end.
- English and Vietnamese guest flows have been checked on real phones.

## Release Readiness Preflight

Run this before merging a PR to `main`:

```bash
npm run check:release-readiness -- --pr=1
npm run check:release-readiness -- --pr=1 --preview-url=https://hanfirstbirthday-f5wol7z9g-ianalysed.vercel.app
```

The checker is read-only. It verifies PR `Validate` and Vercel signals, checks whether `main` has visible branch protection or rulesets, confirms that required Vercel Production environment variable names exist, treats shared `HOST_PIN_HASH` as informational, accepts Production `PARTY_SESSION_IS_TEST=true`, and can optionally recheck Preview routes plus `/api/party/session` with `--preview-url`. It does not print encrypted secret values.

## Safe Release Flow

1. Create a feature branch locally.
2. Commit scoped changes.
3. Push the feature branch to GitHub.
4. Confirm GitHub CI passes.
5. Confirm Vercel creates a Preview Deployment from the GitHub commit.
6. Run manual hosted live validation only when preview secrets and test isolation are ready.
7. Open a pull request into `main`.
8. Merge only after CI and the intended Vercel preview status pass.
9. Allow `main` Production deployment only after Production readiness passes.
10. Complete Physical Rehearsal before relying on the setup at the party.

## Branch Protection

Ian's GitHub account must configure branch protection or a ruleset because it requires repository admin access.

Recommended `main` protections:

- require a pull request before merge
- require status checks before merge
- select the `Validate` GitHub Actions check
- require branches to be up to date before merge when practical
- block force pushes
- block branch deletion
- optionally require Vercel deployment status once Vercel Git integration is connected

For a one-person personal repository, one approval is optional. Do not add approval requirements that make urgent party-day fixes unnecessarily awkward.

## Rollback

Preferred rollback options:

- revert the bad commit on `main`
- redeploy a previous verified Vercel deployment
- intentionally promote a verified preview only when Ian approves that action

Do not fix production by editing untracked local files and running an undocumented local CLI deployment.

## Emergency Manual Deployment Policy

Manual `npx vercel deploy` may be used only when GitHub-driven deployment is unavailable and Ian explicitly approves the reason, target, and environment. Do not run `vercel --prod` without explicit approval.
