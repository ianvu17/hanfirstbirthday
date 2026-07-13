# Party Session Architecture

## Core Entities

`party_key` identifies the birthday event. The default is `han-first-birthday`.

`deployment_environment` identifies the runtime environment: `development`, `preview`, or `production`. Vercel sets this through `VERCEL_ENV`; `PARTY_DEPLOYMENT_ENVIRONMENT` can override it if needed.

`party_sessions` stores one game run. A row starts in lobby, moves through host-driven quiz phases, and ends as finished or archived. A new game creates a new row.

`participants` stores one guest identity for one session. Display names are not permanent identity; the browser receives an opaque resume cookie and Supabase stores only its hash.

`question_responses` stores immutable locked answers or timeouts. The database enforces one response per `party_session_id`, `participant_id`, and `question_id`.

`host_command_log` stores compact command audit rows. `command_id` is unique within a session so retries of the same host command can be recognized.

## Current Session Selection

Current selection is explicit:

```text
party_key + deployment_environment + is_current = true
```

The database has a partial unique index that allows only one current session per party/environment context. Finished and archived sessions are not current. Historical rows remain queryable through the host session history.

The public join code is no longer a current-session pointer. It remains a public room code used for QR URLs.

## Lifecycle

```text
create
-> lobby
-> question_ready
-> question_active
-> question_locked
-> answer_reveal
-> leaderboard
-> waiting_for_host
-> finished
-> archived
```

Finishing a game sets the session to `finished` and clears `is_current`. Refreshing guest, display, host, or `/api/party/session` after that returns `session: null` with `reason: "no_active_session"` until the host explicitly creates a new session.

## New Game Behavior

Creating a new session inserts a new `party_sessions` row in `lobby` with revision `0`, no participants, and no responses. Old participants, responses, and host commands stay attached to their original session. Starting the game is a separate host command from creating the session.

## Read Side Effects

Read operations must not create sessions:

- opening `/{locale}`
- opening `/{locale}/play`
- opening `/{locale}/host`
- opening `/display/party`
- calling `GET /api/party/session`
- realtime reconnects

If no session is current, reads return a clear no-session state. Host-authorized mutation routes create or archive sessions.

## Idempotency

Session creation uses `POST /api/party/sessions` with a client idempotency key. The database function `create_party_session` takes an advisory transaction lock by party/environment and has a unique `(party_key, deployment_environment, create_idempotency_key)` index. Repeating the same create request returns the same row; concurrent different create requests cannot create two current sessions.

Host commands send deterministic command ids scoped to `session id + command + revision`. The database keeps a unique `(party_session_id, command_id)` index, and state updates use expected revision compare-and-swap.

Guest responses remain protected by unique response constraints. Exact duplicate submissions can return the existing accepted state; conflicting duplicates are rejected.

## Environment Isolation

Preview and Production may share the same Supabase project, but they do not share current-session selection because `deployment_environment` is part of the selector and unique current-session constraint.

`PARTY_SESSION_IS_TEST` is metadata only. It means the session contains rehearsal/test data for filtering and cleanup. It is not an app mode, not the deployment environment, and not the current-session selector.

## Ian's Controls

Host Controller:

- `Create new session`: creates a fresh lobby session.
- `Start game`: prepares the first question for the current session.
- phase button: advances the current valid host transition.
- `Finish party`: ends the current session and clears it from current selection.
- `Archive session`: archives a selected session while preserving rows.
- `Recent sessions`: shows session id, lifecycle, test marker, counts, revision, and timestamps.

## Operational Runbook

1. Open `/{locale}/host`.
2. Unlock with the Host PIN.
3. If no session is active, click `Create new session`.
4. Confirm the Host Controller shows lobby, revision `0`, and zero participants/responses.
5. Display `/display/party` on the laptop/TV.
6. Guests scan the displayed QR and join.
7. Click `Start game`, then advance through the quiz.
8. Click `Finish party` at the end.
9. For another run, click `Create new session`; old rows remain in recent history.
