# Production-polish Preview rehearsal

- Deployment: `https://hanfirstbirthday-84wfq2wty-ianalysed.vercel.app`
- Vercel target: Preview
- Git branch: `codex/party-flow-realtime-mobile`
- Application commit: `6df8fff`
- Test session: `1ac16d12-1ce8-4ac5-8950-65a74ac7b677` (`is_test=true`)
- Test window: 2026-07-18 23:49–23:51 UTC (2026-07-19 09:49–09:51 AEST)
- Automation: Playwright Chromium browser emulation; not physical-device testing

The three-question rehearsal used isolated Host (390×844), Party Screen (1366×768), English guest (390×640), Vietnamese guest (390×640), and slow English guest (390×844) contexts. It completed the authoritative timer, immutable submissions, bilingual reveal, leaderboard, finished winner, and winner-only certificate paths.

`results.json` records 3/3 ready, public and participant pre-reveal score secrecy, complete 20→0 sequences on all three room surfaces, scoring results, final state, trace counts, and certificate authorization (one winner 200; two non-winner 403 responses). Expiring signed avatar URLs are redacted.

The `how-to-play/` matrix was captured from the same deployed URL at 390×640 EN, 390×844 VI, 768×1024 VI, 1366×768 EN, 1440×900 VI, 1920×1080 EN, and 390×844 VI at 125% text scaling/reduced motion. The checker found no horizontal overflow and confirmed a reachable Ready action.

The actual downloaded winner PDF is one A4 landscape page. `winner-certificate-rendered.png` is the Poppler render used for visual review of the vector serrated seal, ribbon tails, layout, score, and 3-question denominator.

Physical iOS Safari and Android Chrome were not tested. The gallery contract was verified in the deployed DOM (`capture` absent), and browser emulation exercised file selection, cancellation, retry, and upload persistence, but operating-system picker presentation remains a physical-device rehearsal item.
