# Deployed UX Investigation

Test window: July 13, 2026, 20:54-20:59 AEST.

## 1. Executive Finding

Mobile vertical scrolling was reproduced on the deployed Production app. Production overflows on multiple mobile heights during the deployed guest quiz screen, including 96px at 375 x 667 and 375px at 390 x 640 with 125% text scaling.

The Live/Disconnected flicker was not captured as a timestamped text flip in this run. A related deployed status defect was reproduced: Production renders `LIVE` with the crossed/disconnected `WifiOff` icon. Source/deployment inspection also shows Production is running the older connection implementation that intentionally downgrades visible status during every refresh.

The biggest finding is deployment mismatch. Production is not running the current branch that was previously reported as fixed. The latest branch Preview contains the newer mobile/status code, but it has no active remote party session, so the full guest quiz path cannot be validated there yet.

## 2. Deployment Tested

Production URL tested: `https://hanfirstbirthday.vercel.app`

Production deployment:

| Field | Value |
| --- | --- |
| Deployment URL | `https://hanfirstbirthday-hbzwjlpf4-ianalysed.vercel.app` |
| Type | Production |
| Vercel deployment id | `dpl_3qAZ4LTbFx6XbWY2zXSsFZJ467VV` |
| Created | July 13, 2026, 05:29:44 UTC |
| Branch / commit | `main`, `4b24d4eb469354b3c1396173948bdafa84468152` |
| Runtime | remote Supabase runtime |
| Session | current Production session `f2bea267-e675-4dd9-b0a8-33af89f155f3`, `isTest=true`, phase `question_ready`, revision `1` |

Preview URL checked: `https://hanfirstbirthday-5yl9hh1e3-ianalysed.vercel.app`

Preview deployment:

| Field | Value |
| --- | --- |
| Deployment URL | `https://hanfirstbirthday-5yl9hh1e3-ianalysed.vercel.app` |
| Type | Preview |
| Vercel deployment id | `dpl_85gekauFSNn5XF4iqQfi2ejk5To5` |
| Created | July 13, 2026, 10:10:23 UTC |
| Branch / commit | `codex/party-flow-realtime-mobile`, `28e527b21e53cd11b73f6cdab9a1a93ae387e751` |
| Runtime | remote Supabase runtime, no active Preview session |

Host access was not available in environment variables. `LIVE_REALTIME_HOST_PIN=false`, `HOST_PIN=false`; host endpoints reported `configured=true`, `authorized=false`.

## 3. Mobile Reproduction Matrix

Measured deployed Production state: real onboarding into `/{locale}/play`, current remote session phase `question_ready`. Because Production is stale, answer choices are still visible in this phase.

| Device / viewport | Language | Quiz state | Viewport height | Scroll height | Overflow px | Essential control below fold | Screenshot | Result |
| --- | --- | --- | ---: | ---: | ---: | --- | --- | --- |
| 320 x 568 | EN | Join timed out before controller | 568 | n/a | n/a | n/a | `chromium-320x568-en-error.png` | Blocked by deployed join/controller timeout |
| 320 x 667 | EN | Join timed out before controller | 667 | n/a | n/a | n/a | `chromium-320x667-en-error.png` | Blocked by deployed join/controller timeout |
| 360 x 640 | EN | Join timed out before controller | 640 | n/a | n/a | n/a | `chromium-360x640-en-error.png` | Blocked by deployed join/controller timeout |
| 360 x 740 | EN | Question ready with answer choices visible | 740 | 763 | 23 | No; submit visible, page still scrolls | `chromium-360x740-en-question-preview-before-scroll.png` | Fails no-scroll target |
| 375 x 667 | EN | Question ready with answer choices visible | 667 | 763 | 96 | Submit is partly low in viewport; review requires scroll comfort | `chromium-375x667-en-question-preview-before-scroll.png` | Fails no-scroll target |
| 390 x 640 | VI | Question ready with answer choices visible | 640 | 718 | 78 | Submit bottom is below viewport | `chromium-390x640-vi-question-preview-before-scroll.png` | Fails no-scroll target |
| 390 x 844 | EN | Join timed out before controller | 844 | n/a | n/a | n/a | `chromium-390x844-en-error.png` | Blocked by deployed join/controller timeout |
| 393 x 852 | VI | Question ready with answer choices visible | 852 | 852 | 0 | No | `chromium-393x852-vi-question-preview-before-scroll.png` | Fits this state |
| 412 x 732 | EN | Question ready with answer choices visible | 732 | 732 | 0 | No | `chromium-412x732-en-question-preview-before-scroll.png` | Fits this state |
| 412 x 915 | VI | Join timed out before controller | 915 | n/a | n/a | n/a | `chromium-412x915-vi-error.png` | Blocked by deployed join/controller timeout |
| 360 x 560 effective height | EN | Join timed out before controller | 560 | n/a | n/a | n/a | `chromium-360x560-effective-browser-ui-en-error.png` | Blocked by deployed join/controller timeout |
| 390 x 640, 125% text | VI | Question ready with answer choices visible | 640 | 1015 | 375 | Yes; submit is far below fold | `chromium-390x640-text-scale-125-vi-question-preview-before-scroll.png` | Fails badly |
| Pixel 5 emulation | VI | Question ready with answer choices visible | 727 | 727 | 0 | No | `pixel-5-vi-question-preview.png` | Fits this state |
| iPhone 12 WebKit | EN | n/a | n/a | n/a | n/a | n/a | `iphone-12-en.json` | Blocked: WebKit browser binary unavailable |

## 4. Mobile Root Cause Analysis

1. Production is running the older guest controller, not the latest mobile branch.
   - Files: `components/party/remote/remote-guest-controller.tsx`, `components/design/page-shell.tsx`.
   - Production commit `4b24d4e` uses `min-h-[calc(100vh-8rem)] max-w-3xl py-4`, `PaperPanel` default padding, `space-y-5`, `text-4xl` question text, and always renders answer choices when a question exists.
   - Current branch `28e527b` has smaller mobile spacing, `100dvh`, smaller mobile type, a compact panel, and hides answer choices during `question_ready`.
   - Measured impact: the Production controller is 731px tall at 375 x 667, forcing 96px page overflow. Confidence: high.

2. The deployed design asks one phone screen to carry header, timer/status badges, long question text, three answer buttons, score, and submit.
   - Measured costs at 375 x 667: question text 225px, answer list 192px, submit row starts at 666px, controller total 731px.
   - At 390 x 640 with 125% text, question text grows to 281px, answer list to 240px, controller to 975px, overflow to 375px.
   - Confidence: high.

3. Nested viewport sizing and safe-area/padding are double-counted.
   - `PageShell` is `min-h-screen min-h-dvh` with 16px top and bottom safe-page padding and `overflow-hidden`.
   - The Production guest controller adds its own viewport minimum plus vertical padding inside that shell.
   - Measured shell height at 375 x 667 is 763px, not 667px.
   - Confidence: high.

4. Decorative absolute content follows the expanded page height.
   - `paper-stage` and `blue-runner` are anchored to the bottom of the expanded `main`, so decorative content extends with the overflow.
   - This is not the primary cause, but it makes the after-scroll view look like intentional page content rather than accidental overflow.
   - Confidence: medium.

Vietnamese does not always worsen the base state because the current Vietnamese fixture question wraps shorter than the English fixture at these widths. Vietnamese with text scaling materially worsens the issue.

Previous tests missed this because they were not run against the deployed Production code path, did not catch that Production was stale, and treated isolated/local states as equivalent to the real remote guest journey.

## 5. Network Flicker Trace

Timed Live -> Disconnected text flicker was not captured. The closest successful Production trace shows the older runtime creating repeated overlapping refresh windows during join:

```text
10:55:13.436 /api/party/join start
10:55:13.438 /api/party/session start
10:55:14.640 /api/party/session 200 after 1202ms
10:55:14.647 websocket create
10:55:14.748 websocket open
10:55:15.639 /api/party/session start
10:55:18.253 /api/party/session 200 after 2614ms
10:55:19.091 /api/party/join 200 after 5654ms
10:55:19.219 /api/party/session start
10:55:21.764 /api/party/session 200 after 2544ms
10:55:21.796 /api/party/session start
10:55:23.495 /api/party/session 200 after 1699ms
```

Visual status defect reproduced in screenshot: `chromium-375x667-en-question-preview-before-scroll.png` shows the badge label `LIVE` with the crossed `WifiOff` icon.

A narrow follow-up probe recorded one `/api/party/join` 500 and stayed on `Connecting`; see `logs/production-flicker-probe.json` and `production-flicker-probe-final.png`. That probe is evidence of deployed join instability, not proof of the reported Live/Disconnected flicker.

## 6. Network Root Cause Analysis

Contributing cause 1: Production badge uses a disconnected icon for every connection state.

- Source event: any successful state render.
- State transition: none required; even `connected` renders `WifiOff`.
- UI mapping: `origin/main` inlines `<WifiOff />` beside `{copy[connection]}` in `RemoteGuestController`.
- Affected surfaces: Production guest controller; host may have separate old/new behavior depending deployed code.
- Frequency: every visible guest controller render in Production.
- Duration: persistent.
- Why stabilization did not prevent it: this is an icon mapping bug, not a realtime stability issue.
- Confidence: high.

Contributing cause 2: Production connection hook downgrades status on normal refresh.

- Source event: `refresh()` start, polling interval, realtime wake-up refresh, page refresh, or route remount.
- State transition: `connected -> reconnecting`; base session snapshot with `includeGuest=true` can also briefly set `stale`.
- UI mapping: Production badge maps anything not `connected` to coral status with `WifiOff`.
- Affected surfaces: guest controller and any surface using the older hook.
- Frequency: at least every 8s while connected, plus each realtime wake-up and join-time refresh.
- Duration: depends on `/api/party/session` latency; measured refreshes were 1.1s to 2.7s in the successful trace and 5.7s for one join.
- Why stabilization did not prevent it: Production does not contain the branch's grace timers or separated `ConnectionStatusBadge`.
- Confidence: high from source/deployment inspection, medium from visual trace because the text flip was not captured.

Contributing cause 3: the tested Preview cannot validate the new implementation.

- Source event: Preview `/api/party/session`.
- State transition: no active session; response is `session: null`, `reason: no_active_session`.
- UI mapping: guest route cannot exercise the full remote quiz controller.
- Confidence: high.

Network question answers:

- The source event that can cause Live -> non-live in Production is every `refresh()` start and error/stale path in `lib/party-remote/use-remote-party.ts` at `origin/main`.
- I did not prove the browser truly enters offline during Ian's flicker; the measured browser remained online.
- Polling does temporarily downgrade visible status in Production source.
- Every snapshot refresh in Production can set `reconnecting` before the request resolves.
- Realtime `CHANNEL_ERROR` and `TIMED_OUT` are mapped directly to `stale` in Production.
- Multiple subscriptions can create extra refreshes when session id changes or participants update; no direct fighting was proven.
- Remount resets state to `connecting`.
- Navigation to `/{locale}/play` recreates the hook.
- Production has no grace timers to cancel or preserve.
- `navigator.onLine` is used only in catch/offline handling; it is not sufficient evidence of realtime health.
- Vercel/serverless latency is involved: refreshes measured up to 2.7s, join up to 5.7s.
- Authentication cookies are involved in participant snapshots; a delayed join means early snapshots do not include `guest`.
- The UI badge is from the old Production runtime path, not the current branch's `ConnectionStatusBadge`.
- The crossed/disconnected icon is used for a state labelled `LIVE` in Production.
- Exact flicker frequency/duration was not captured; source implies at least every poll/realtime refresh.
- Guest surface is affected. Host/Party Screen were not fully exercised without Host PIN.

## 7. Deployment Consistency Check

Production does not contain the latest mobile/status changes. Production is on `main` at `4b24d4e`; the current branch and latest Preview are at `28e527b`.

Differences that matter:

- `components/party/connection-status-badge.tsx` exists only on the current branch.
- Production `RemoteGuestController` always renders answer options for any question; current branch hides them in `question_ready`.
- Production uses larger mobile type/spacing and older `100vh` sizing; current branch has compact mobile sizing.
- Production connection hook sets `reconnecting` on refresh start; current branch adds grace timers.

Preview does contain the current branch but has no active remote session. Therefore it cannot prove the current fixes work in the full guest quiz journey.

## 8. Test Gap Analysis

The previous validation passed because it likely tested localhost or isolated local visual states, not the deployed Vercel runtime that Ian manually reviewed.

Specific gaps:

- Localhost versus deployed: Production was stale and running a different code path.
- Isolated states versus full journey: the real route includes onboarding, participant cookie setup, join latency, remote snapshots, Supabase realtime, and Vercel serverless latency.
- Layout viewport versus visual viewport: this run measured both; they matched in Chromium, but small effective heights and text scaling still failed.
- Final-state assertions versus transient-state assertions: previous checks likely saw an eventual `connected` state and missed refresh-time downgrades.
- Incorrect pass criteria: no horizontal overflow is not the same as no vertical page scrolling.
- Missing device/runtime coverage: small-height phones, Vietnamese, text scaling, Production deployment, and Host-controlled remote states were not all covered.

## 9. Proposed Fix Options

Mobile option A, recommended: deploy the current branch to a Preview with an active test session, then remeasure before changing UI again.

- Files likely affected: no new product files; deployment/session setup only.
- Expected UX result: confirms whether the already-written compact mobile changes actually solve the Production overflow.
- Tradeoff: requires Host PIN or a Preview test session.
- Risk: low.
- Test strategy: rerun `scripts/investigate-deployed-ux.ts` against Preview after creating an active session.

Mobile option B: make the phone controller a constrained one-screen tool on small heights.

- Files likely affected: `components/party/remote/remote-guest-controller.tsx`, possibly `components/design/page-shell.tsx`.
- Expected UX result: header/status compresses, question type reduces, answers/submit fit without page-level scroll.
- Tradeoff: less celebratory spacing on small phones.
- Risk: medium.
- Test strategy: deployed Preview Playwright matrix with 320 x 568 through 412 x 915, text scaling, EN/VI.

Mobile option C: allow an internal answer area to scroll while keeping header/question/submit pinned.

- Files likely affected: `components/party/remote/remote-guest-controller.tsx`.
- Expected UX result: essential submit stays reachable, long answer lists scroll internally.
- Tradeoff: more complex interaction and must clearly distinguish internal scrolling from page scrolling.
- Risk: medium.
- Test strategy: verify page scrollHeight equals clientHeight while answer container scrolls only when copy requires it.

Network option A, recommended: first validate the current branch's connection badge and grace-timer implementation on an active Preview.

- Files likely affected: deployment/session setup, then `components/party/connection-status-badge.tsx` and `lib/party-remote/use-remote-party.ts` only if still failing.
- Expected UX result: no disconnected icon while Live; no visible downgrade during normal refresh latency.
- Tradeoff: requires a real active Preview session.
- Risk: low.
- Test strategy: timestamp visible badge text/icon through join, idle, refresh, realtime update, and network interruption.

Network option B: model connection as separate transport and snapshot freshness signals.

- Files likely affected: `lib/party-remote/use-remote-party.ts`, `components/party/connection-status-badge.tsx`, host/display consumers.
- Expected UX result: polling refresh does not imply disconnected; realtime reconnect can show a softer syncing state while last snapshot remains usable.
- Tradeoff: slightly richer state model.
- Risk: medium.
- Test strategy: unit-test reducer transitions plus deployed browser trace for intermediate visible states.

Network option C: add diagnostic-only connection event logging behind a query flag.

- Files likely affected: `lib/party-remote/use-remote-party.ts`.
- Expected UX result: no user-facing change; easier future diagnosis.
- Tradeoff: must avoid noisy production logs and secrets.
- Risk: low.
- Test strategy: Playwright with `?debugConnection=1`, verify logs are absent without flag.

## 10. Evidence Index

Evidence folder: `docs/evidence/deployed-ux-investigation-20260713-r3`

Key files:

- `deployment-metadata.json`: Vercel and git metadata.
- `results.json`: machine-readable combined run output.
- `measurements/*.json`: per-profile layout metrics and sanitized traces.
- `logs/production-flicker-probe.json`: narrow status probe.
- `screenshots/*before-scroll.png`: failing and passing mobile states.
- `screenshots/*after-scroll.png`: same states after scrolling.
- `screenshots/production-flicker-probe-final.png`: join instability probe final state.

Investigation script:

- `scripts/investigate-deployed-ux.ts`

## 11. Recommended Next Implementation Task

Recommendation: blocked by deployment mismatch until the latest branch has an active deployed remote session.

Next narrow task:

1. Create or activate a Preview test party session for `codex/party-flow-realtime-mobile` at `28e527b`.
2. Run the deployed Playwright investigation against that Preview, including host-controlled phase progression.
3. If overflow or flicker remains on that Preview, implement targeted fixes only in `RemoteGuestController`, `PageShell`, `ConnectionStatusBadge`, and `useRemotePartySnapshot`.
4. Revalidate against the deployed Preview, then promote/merge only after deployed evidence passes.

Do not claim readiness for physical rehearsal yet.

## 12. Repository Guidance Update

Updated file: `AGENTS.md`.

Exact deployed-validation rule added:

> This project already has functional CI/CD and Vercel deployments. UX, browser, realtime, QR-origin, environment-sensitive, and release-candidate validation should be performed against the relevant Vercel Preview or Production deployment whenever practical. Agents must use Vercel CLI to discover the correct deployment URL and use Playwright or equivalent browser automation against the deployed HTTPS environment. Localhost remains useful for development and unit-level debugging, but it is not sufficient evidence for deployed UX, mobile viewport, realtime, authentication, environment variable, cookie, or network behavior. Reports must state the exact deployed URL, deployment type, branch or commit, and test time. Agents must not claim an issue is fixed based only on localhost when the issue can differ in Vercel.

This belongs in `AGENTS.md` because that is the repository's canonical agent-facing workflow file.

## 13. Follow-Up Preview Validation

Test window: July 13, 2026, 21:09-21:36 AEST.

### Environment Established

Current implementation branch before additional fixes:

| Field | Value |
| --- | --- |
| Preview URL | `https://hanfirstbirthday-5yl9hh1e3-ianalysed.vercel.app` |
| Vercel deployment id | `dpl_85gekauFSNn5XF4iqQfi2ejk5To5` |
| Branch / commit | `codex/party-flow-realtime-mobile`, `28e527b21e53cd11b73f6cdab9a1a93ae387e751` |
| Created | July 13, 2026, 20:10:23 AEST |
| Runtime context | `deploymentEnvironment=preview`, `publicJoinCode=han-turns-one`, `isTest=true` |

Redeployed Preview after the targeted connection fix:

| Field | Value |
| --- | --- |
| Preview URL | `https://hanfirstbirthday-ahk50sup8-ianalysed.vercel.app` |
| Vercel deployment id | `dpl_G3RHwLGETsgPyxLYxes8yHRLQZvZ` |
| Branch / commit | `codex/party-flow-realtime-mobile`, `66a140a` |
| Created | July 13, 2026, 21:29:01 AEST |
| Test session | `290fb4f7...`, `isTest=true`, Preview environment |
| Evidence | `docs/evidence/deployed-ux-investigation-20260713-preview-r2` |

Preview environment variable presence, names only:

| Variable | Preview scope | Status |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Preview | Present |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview | Present |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview | Present |
| `NEXT_PUBLIC_APP_URL` | Preview | Absent; Preview used `VERCEL_URL` fallback |
| `PARTY_JOIN_CODE` | Preview | Absent; runtime defaulted to `han-turns-one` |
| `PARTY_SESSION_IS_TEST` | Preview | Present |
| `HOST_PIN_HASH` | Preview | Present |
| `HOST_SESSION_SECRET` | Preview | Present |

The Preview `no_active_session` cause was confirmed: Supabase/runtime and host auth were configured, but no current session row existed for `party_key=han-first-birthday` and `deployment_environment=preview`. Creating a Preview session through the deployed host flow removed the validation gap.

### Current-Branch Result Before Additional Changes

The deployed current-branch Preview at `28e527b` passed the normal-scale mobile no-scroll checks that were measured, including the real host-driven preview state where answer choices are hidden. It also passed the revised host-driven question flow: host login, create test session, display lobby QR/join URL, English and Vietnamese guests join, Start game, preview without choices, Reveal answers, automatic 20-second answering window, locked answer survives refresh, no manual lock action, deadline auto-closes, late answer rejected with `409`, reveal answer, leaderboard, complete presentation, and next question preview.

It did not pass connection behavior. A focused deployed probe on the `28e527b` Preview captured visible `Live -> Reconnecting -> Live` changes while `navigator.onLine=true` during ordinary idle sampling and host-triggered refreshes. The icon was the reconnect spinner, not `WifiOff`, so the old Production `LIVE` + disconnected icon defect was fixed on the branch, but visible flicker remained.

The only mobile exception observed before and after the connection fix was `390 x 640`, Vietnamese, 125% text scaling, `question-preview`: `50px` document overflow and the inactive Submit button bottom at `654px`. Normal scale had zero page overflow and no horizontal overflow across the required viewport list.

### Implemented Correction

Changed files:

- `lib/party-remote/use-remote-party.ts`
- `lib/party-remote/__tests__/session-architecture.test.ts`
- `scripts/validate-preview-party-flow.ts`

Behavior changed:

- Normal polling refresh no longer downgrades a visible live connection.
- Visible connection state now separates browser reachability, accepted snapshot presence, confirmed transport issue, and hard error.
- Browser offline state wins over late successful snapshots.
- Transient realtime channel churn is stabilized separately from refresh activity.
- Tests now assert that polling cannot make Live become Reconnecting and that offline/transport signals resolve to distinct visible states.

### Final Redeployed Preview Results

Final deployed validation command:

```bash
PREVIEW_PARTY_BASE_URL='https://hanfirstbirthday-ahk50sup8-ianalysed.vercel.app' \
PREVIEW_PARTY_EVIDENCE_DIR='docs/evidence/deployed-ux-investigation-20260713-preview-r2' \
npx tsx scripts/validate-preview-party-flow.ts
```

Final flow result:

- Host authenticated against the deployed Preview.
- A fresh Preview test session was created through host-authorized session creation.
- Party Screen displayed the lobby join URL/QR.
- Guest 1 joined in English; Guest 2 joined in Vietnamese.
- Question preview hid answer choices.
- Reveal answers opened choices and started the authoritative timer.
- Both guests submitted; locked answer survived refresh.
- Deadline closed answering automatically without a host lock.
- Late answer was rejected with `409`.
- Correct-answer reveal and leaderboard rendered.
- Host advanced through complete presentation to the next question preview.

Mobile deployed matrix:

| State | Viewports / languages | Result |
| --- | --- | --- |
| Lobby | 390 x 640 EN, VI | Pass: zero page overflow, Submit visible |
| Active/selected/submitting/locked/closed/reveal/leaderboard | 390 x 640 EN | Pass: zero page overflow, Submit visible |
| Question preview | 320 x 568 through 412 x 915, EN and VI | Pass: zero page overflow, no horizontal overflow |
| 125% text scaling | 375 x 667 EN | Pass |
| 125% text scaling | 390 x 640 VI | Documented exception: 50px page overflow in preview state, inactive Submit below fold |

Connection trace from `logs/connection-status-probe.json` on the redeployed Preview:

| Sequence | Visible result |
| --- | --- |
| Idle polling, 25 samples over about 10 seconds | Stayed `Live`; icon class `lucide-circle-check` |
| Host-triggered refresh window, 15 samples | Stayed `Live`; icon class `lucide-circle-check` |
| Offline immediately after browser interruption | Initially retained last usable `Live` during grace period |
| Offline after 2.2s | `Offline`; icon class `lucide-wifi-off` |
| Recovery after browser online and refresh | Returned to `Live`; icon class `lucide-circle-check` |

Automated validation:

```bash
npm run validate
```

Result: passed. This included content validation, TypeScript, ESLint, Party Engine tests, Party Runtime tests, Supabase migration assertions, and production build.

Remaining limitations:

- Browser validation used Playwright Chromium, not physical iPhone Safari or Android Chrome.
- Full active-state no-scroll measurement was captured at 390 x 640 EN; the full viewport matrix was captured for question preview across EN/VI.
- The 125% text-scale Vietnamese exception remains documented; no layout fix was made because the overflow was limited to the preview state and normal mobile viewports passed.
- Production remains stale and was not promoted or used as evidence for the branch.

Recommendation: ready for Ian review on Preview.
