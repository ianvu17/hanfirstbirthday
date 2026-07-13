import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getPartyDeploymentEnvironment } from "@/lib/supabase/env";

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

test("deployment environment resolves to explicit Vercel contexts", () => {
  const previousExplicit = process.env.PARTY_DEPLOYMENT_ENVIRONMENT;
  const previousVercel = process.env.VERCEL_ENV;
  const previousNode = process.env.NODE_ENV;

  process.env.PARTY_DEPLOYMENT_ENVIRONMENT = "";
  process.env.VERCEL_ENV = "preview";
  assert.equal(getPartyDeploymentEnvironment(), "preview");

  process.env.VERCEL_ENV = "production";
  assert.equal(getPartyDeploymentEnvironment(), "production");

  process.env.VERCEL_ENV = "unexpected";
  Reflect.deleteProperty(process.env, "NODE_ENV");
  assert.equal(getPartyDeploymentEnvironment(), "development");

  restoreEnv("PARTY_DEPLOYMENT_ENVIRONMENT", previousExplicit);
  restoreEnv("VERCEL_ENV", previousVercel);
  restoreEnv("NODE_ENV", previousNode);
});

test("current session reads are not implemented through ensure-and-insert semantics", () => {
  const repository = readFileSync("lib/party-remote/repository.ts", "utf8");
  const loadCurrentStart = repository.indexOf("export async function loadCurrentPartySession");
  const createStart = repository.indexOf("export async function createPartySession");

  assert.notEqual(loadCurrentStart, -1);
  assert.notEqual(createStart, -1);
  assert.equal(repository.includes("export async function ensureActivePartySession"), false);

  const loadCurrentSource = repository.slice(loadCurrentStart, createStart);
  assert.equal(loadCurrentSource.includes('.eq("is_current", true)'), true);
  assert.equal(loadCurrentSource.includes(".insert("), false);
  assert.equal(loadCurrentSource.includes(".rpc(\"create_party_session\""), false);
});

test("host command id is deterministic for retries of the same transition", () => {
  const hostController = readFileSync(
    "components/party/host/production-host-controller.tsx",
    "utf8"
  );

  assert.equal(
    hostController.includes(
      'commandId: `${snapshot.session.id}:${command}:${snapshot.session.revision}`'
    ),
    true
  );
  assert.equal(hostController.includes("commandId: `${command}:${snapshot.session.revision}:${Date.now()}`"), false);
});
