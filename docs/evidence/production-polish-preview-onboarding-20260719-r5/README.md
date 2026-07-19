# Remote onboarding reliability rehearsal

- Deployment: `https://hanfirstbirthday-84wfq2wty-ianalysed.vercel.app`
- Vercel target: Preview
- Git branch/application commit: `codex/party-flow-realtime-mobile` / `6df8fff`
- Test time: 2026-07-19 00:00–00:01 UTC (2026-07-19 10:00–10:01 AEST)
- Automation: Playwright Chromium mobile emulation at 390×844

One authenticated participant traversed English onboarding, selected a real local PNG through the gallery input, observed the upload panel, cancelled an intercepted in-flight XHR, retained the editor preview, retried successfully through the hosted avatar route, and persisted a private photo avatar.

The same participant then used in-app Back to edit the display name, switched the persisted locale to Vietnamese, resumed with the confirmed avatar, completed Vietnamese How to Play, and became ready. The host observed 1/1 ready; Ready→Back changed it to 0/1; clicking Ready again restored 1/1. After the host started, opening onboarding redirected to `/vi/play` and exposed no onboarding Back action.

`results.json` records the single stable participant id and redacted final state. Screenshots show cancelled upload, Vietnamese How to Play after editing, and host ready/not-ready lobby states.
