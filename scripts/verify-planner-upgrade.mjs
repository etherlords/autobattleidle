/* global AbortController, TextDecoder, URL, clearTimeout, fetch, process, setTimeout */
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "../.tools/planner-runtime/node_modules/.pnpm/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js";
import { StdioClientTransport } from "../.tools/planner-runtime/node_modules/.pnpm/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js";
import { MarkdownStore } from "../.tools/planner-runtime/node_modules/@etherlords/planner-mcp/dist/storage/markdown-store.js";
import { renameWithTransientRetry } from "../.tools/planner-runtime/node_modules/@etherlords/planner-mcp/dist/storage/atomic-persistence.js";
import { startPlannerPreview } from "../.tools/planner-runtime/node_modules/@etherlords/planner-mcp/dist/ui.js";
import { DEFAULT_PLANNER_TOOLS } from "../.tools/planner-runtime/node_modules/@etherlords/planner-mcp/scripts/lib/planner-tool-surface.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeRoot = path.join(projectRoot, ".tools", "planner-runtime");
const packageRoot = await realpath(
  path.join(runtimeRoot, "node_modules", "@etherlords", "planner-mcp"),
);
const serverEntrypoint = path.join(packageRoot, "dist", "server.js");
const setupEntrypoint = path.join(packageRoot, "scripts", "setup-project.mjs");
const archive = path.join(projectRoot, ".release", "planner", "etherlords-planner-mcp-1.1.3.tgz");
const sidecar = `${archive}.sha256`;
const expectedSha256 = "29046e085787de20a983acd2c14de1446141159f2905fa754cefefd5d1d1cd43";
const fixture = await mkdtemp(path.join(os.tmpdir(), "autobattleidle-planner-acceptance-"));

try {
  const packageManifest = JSON.parse(
    await readFile(path.join(packageRoot, "package.json"), "utf8"),
  );
  const archiveSha256 = createHash("sha256")
    .update(await readFile(archive))
    .digest("hex");
  const declaredSha256 = (await readFile(sidecar, "utf8")).trim().split(/\s+/)[0].toLowerCase();
  assert(
    packageManifest.version === "1.1.3",
    `Expected Planner 1.1.3, got ${packageManifest.version}`,
  );
  assert(archiveSha256 === expectedSha256, `Archive SHA-256 mismatch: ${archiveSha256}`);
  assert(declaredSha256 === expectedSha256, `Sidecar SHA-256 mismatch: ${declaredSha256}`);
  await verifyConfigReceipt();
  await bootstrapFixture();
  const doctor = await verifyCanonicalDoctor();
  const mcp = await verifyMcpAndTaskUpdate();
  const recovery = await verifyInterruptedRecovery();
  const transientRename = await verifyTransientRenameRetry();
  const shortIndexLock = await verifyIndexReadLock(500, "short-index-lock", true);
  const longIndexLock = await verifyIndexReadLock(2_500, "long-index-lock", false);
  const ui = await verifyExistingUi();
  process.stdout.write(
    `${JSON.stringify(
      {
        schemaVersion: 1,
        artifact: {
          url: "https://github.com/etherlords/planner/releases/download/v1.1.3/etherlords-planner-mcp-1.1.3.tgz",
          sha256: archiveSha256,
          sidecarSha256: declaredSha256,
          bytes: (await readFile(archive)).byteLength,
          package: "@etherlords/planner-mcp",
          version: packageManifest.version,
        },
        configuration: {
          consumerProjectRoot: projectRoot,
          serverEntrypoint: await realpath(serverEntrypoint),
          storageMode: "in-repo",
          trackerExtended: false,
        },
        doctor,
        mcp,
        recovery,
        transientRename,
        shortIndexLock,
        longIndexLock,
        ui,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await rm(fixture, { recursive: true, force: true });
}

async function verifyConfigReceipt() {
  const config = await readFile(path.join(projectRoot, ".codex", "config.toml"), "utf8");
  for (const expected of [
    `PLANNER_PROJECT_ROOT = "${projectRoot.replaceAll("\\", "\\\\")}"`,
    `PLANNER_CONSUMER_PROJECT_ROOT = "${projectRoot.replaceAll("\\", "\\\\")}"`,
    'PLANNER_STORAGE_MODE = "in-repo"',
    'PLANNER_TRACKER_EXTENDED = "0"',
  ])
    assert(config.includes(expected), `Generated config is missing ${expected}`);
  const configuredEntrypoint = config.match(
    /args = \["([^"]+planner-mcp\/dist\/server\.js)"\]/,
  )?.[1];
  assert(configuredEntrypoint, "Generated config has no Planner entrypoint");
  assert(
    (await realpath(configuredEntrypoint)) === (await realpath(serverEntrypoint)),
    "Generated config is not bound to the installed Planner entrypoint",
  );
}

async function bootstrapFixture() {
  await run(process.execPath, [
    setupEntrypoint,
    "--project-root",
    fixture,
    "--project-id",
    "ACCEPT",
    "--sprint-id",
    "ACCEPT-S1",
    "--sprint-title",
    "Planner consumer acceptance",
    "--goal",
    "Verify Planner upgrade behavior",
    "--task-id",
    "ACCEPT-001",
    "--task-title",
    "Verify structured updates and recovery",
    "--profile",
    "analyzed",
    "--storage-mode",
    "in-repo",
  ]);
}

async function verifyMcpAndTaskUpdate() {
  const { client, close } = await connect("autobattleidle-planner-upgrade");
  try {
    const tools = (await client.listTools()).tools.map((tool) => tool.name).sort();
    assert(equal(tools, DEFAULT_PLANNER_TOOLS), `Unexpected tool surface: ${tools.join(", ")}`);
    const bootstrap = JSON.parse(
      await readFile(path.join(fixture, "planner-bootstrap.request.json"), "utf8"),
    );
    result(await client.callTool({ name: "planner_sprint_bootstrap", arguments: bootstrap }));
    const listed = result(
      await client.callTool({ name: "planner_tasks_list", arguments: { itemId: "ACCEPT-001" } }),
    );
    const initialRevision = listed.data.tasks[0].task.revision;
    const first = updateArguments(initialRevision, "accept-update-1", "first");
    const firstReceipt = result(
      await client.callTool({ name: "planner_task_update", arguments: first }),
    );
    const second = updateArguments(firstReceipt.data.taskRevision, "accept-update-2", "selected");
    const secondReceipt = result(
      await client.callTool({ name: "planner_task_update", arguments: second }),
    );
    const replayReceipt = result(
      await client.callTool({ name: "planner_task_update", arguments: second }),
    );
    assert(replayReceipt.data.idempotentReplay, "Exact task-update retry was not idempotent");
    const brief = await fixtureBrief();
    assert(count(brief, "Criterion selected") === 1, "Selected criterion was duplicated");
    assert(count(brief, "Criterion first") === 0, "Replaced criterion remained rendered");
    assert(count(brief, "VAULT-selected") === 1, "Selected knowledge value was duplicated");
    assert(count(brief, "VAULT-first") === 0, "Replaced knowledge value remained rendered");
    return {
      initialized: true,
      listTools: tools,
      taskUpdate: {
        firstRevision: firstReceipt.data.taskRevision,
        selectedRevision: secondReceipt.data.taskRevision,
        replayIdempotent: replayReceipt.data.idempotentReplay,
        selectedValuesRenderedOnce: true,
        replacedValuesAbsent: true,
      },
    };
  } finally {
    await close();
  }
}

async function verifyCanonicalDoctor() {
  const { client, close } = await connect("autobattleidle-planner-canonical-doctor", projectRoot);
  try {
    const doctor = result(await client.callTool({ name: "planner_doctor", arguments: {} })).data;
    const current = result(
      await client.callTool({ name: "planner_get_current", arguments: {} }),
    ).data;
    assert(doctor.healthy, "Canonical Planner doctor is unhealthy");
    assert(!doctor.recovery.required, "Canonical Planner requires recovery");
    assert(doctor.recovery.journalPaths.length === 0, "Canonical Planner has a pending journal");
    return {
      healthy: true,
      projectId: doctor.projectId,
      sprintId: doctor.sprintId,
      pendingRecovery: false,
      currentTask: current.current?.id ?? null,
      currentTaskReadable: current.current !== null,
      indexAvailable: current.index.available,
      warningCodes: doctor.findings.map((finding) => finding.code),
    };
  } finally {
    await close();
  }
}

async function verifyInterruptedRecovery() {
  const before = await fixtureBrief();
  const currentRevision = Number(before.match(/^revision: (\d+)$/m)?.[1]);
  const input = updateArguments(currentRevision, "accept-recovery", "recovered");
  const briefPath = await fixtureBriefPath();
  let lock;
  const interrupted = new MarkdownStore(fixture, {
    operationId: () => "accept-recovery-operation",
    failpoint: async (name, context) => {
      if (context.operation === "task.update" && name === "after-journal-prepared")
        lock = await holdExclusiveLock(briefPath, 700);
      if (
        context.operation === "task.update" &&
        name === "after-target-replace" &&
        context.index === 0
      )
        throw new Error("Injected interruption after retried target replacement");
    },
  });
  const startedAt = Date.now();
  try {
    await assertRejects(() => interrupted.updateTask(input), "Injected interruption");
  } finally {
    await lock?.released;
  }
  const elapsedMilliseconds = Date.now() - startedAt;
  assert(
    elapsedMilliseconds >= 500,
    `Exclusive-lock retry ended too early: ${elapsedMilliseconds}ms`,
  );
  assert(
    (await fixtureBrief()) !== before,
    "Retried first target was not replaced before interruption",
  );
  const pending = (await interrupted.listOperationJournals()).filter(
    (journal) => journal.state !== "committed",
  );
  assert(pending.length === 1, `Expected one prepared recovery journal, got ${pending.length}`);

  const recoveryModule = new URL(
    "../.tools/planner-runtime/node_modules/@etherlords/planner-mcp/dist/storage/markdown-store.js",
    import.meta.url,
  ).href;
  const childRecovery = JSON.parse(
    await run(process.execPath, [
      "--input-type=module",
      "--eval",
      `const { MarkdownStore } = await import(process.argv[1]); const store = new MarkdownStore(process.argv[2]); const receipt = await store.updateTask(JSON.parse(process.argv[3])); const journals = await store.listOperationJournals(); process.stdout.write(JSON.stringify({ receipt, journals: journals.map(({ operation, idempotencyKey, state, entries }) => ({ operation, idempotencyKey, state, entries })) }));`,
      recoveryModule,
      fixture,
      JSON.stringify(input),
    ]),
  );
  assert(
    childRecovery.receipt.idempotentReplay,
    "Fresh-process exact update did not recover idempotently",
  );
  const after = await fixtureBrief();
  assert(
    count(after, "Criterion recovered") === 1,
    "Recovered criterion was not rendered exactly once",
  );
  assert(count(after, "Criterion selected") === 0, "Pre-recovery criterion was not replaced");
  assert(
    count(after, "VAULT-recovered") === 1,
    "Recovered knowledge value was not rendered exactly once",
  );
  assert(count(after, "VAULT-selected") === 0, "Pre-recovery knowledge value was not replaced");
  assert(
    childRecovery.journals.every((journal) => journal.state === "committed"),
    "A pending journal remained",
  );
  const recoveredJournal = childRecovery.journals.find(
    (journal) =>
      journal.operation === "task.update" && journal.idempotencyKey === "accept-recovery",
  );
  assert(recoveredJournal, "Recovered task-update journal is missing");
  for (const entry of recoveredJournal.entries) {
    const actual = createHash("sha256")
      .update(await readFile(path.join(fixture, entry.target)))
      .digest("hex");
    assert(actual === entry.afterHash, `Recovered target hash mismatch: ${entry.target}`);
  }
  assert(
    (await findTransientFiles(fixture)).length === 0,
    "Planner temporary files remained after recovery",
  );

  const { client, close } = await connect("autobattleidle-planner-recovery-doctor");
  try {
    const doctor = result(await client.callTool({ name: "planner_doctor", arguments: {} }));
    assert(doctor.data.healthy, "Fixture doctor is unhealthy after recovery");
    assert(!doctor.data.recovery.required, "Fixture doctor still requires recovery");
    assert(
      doctor.data.recovery.journalPaths.length === 0,
      "Fixture doctor reports a pending journal",
    );
  } finally {
    await close();
  }
  return {
    restartProcessValidated: true,
    windowsExclusiveLockMilliseconds: 700,
    retryElapsedMilliseconds: elapsedMilliseconds,
    partialTargetCommittedBeforeRestart: true,
    recoveredValueRenderedOnce: true,
    dataLoss: false,
    pendingJournals: 0,
    temporaryFiles: 0,
    committedReceipts: childRecovery.journals.length,
    recoveredTargetHashesVerified: recoveredJournal.entries.length,
  };
}

async function verifyTransientRenameRetry() {
  const directory = path.join(fixture, "rename-retry");
  const source = path.join(directory, "source.txt");
  const target = path.join(directory, "target.txt");
  await mkdir(directory, { recursive: true });
  await writeFile(source, "preserved bytes\n", "utf8");
  let attempts = 0;
  let virtualMilliseconds = 0;
  await renameWithTransientRetry(
    source,
    target,
    async (...args) => {
      attempts += 1;
      if (attempts <= 8)
        throw Object.assign(new Error("Synthetic Windows sharing violation"), { code: "EBUSY" });
      await rename(...args);
    },
    {
      now: () => virtualMilliseconds,
      delay: async (milliseconds) => {
        virtualMilliseconds += milliseconds;
      },
    },
  );
  assert(attempts === 9, `Expected 9 rename attempts, got ${attempts}`);
  assert(virtualMilliseconds === 675, `Expected 675 virtual ms, got ${virtualMilliseconds}`);
  assert((await readFile(target, "utf8")) === "preserved bytes\n", "Renamed bytes changed");
  return { code: "EBUSY", attempts, virtualMilliseconds, dataLoss: false };
}

async function verifyIndexReadLock(lockMilliseconds, idempotencyKey, expectImmediateIndex) {
  const { client, close } = await connect(`autobattleidle-planner-${idempotencyKey}`);
  try {
    const before = result(
      await client.callTool({
        name: "planner_get_execution_context",
        arguments: { itemId: "ACCEPT-001", artifacts: ["BRIEF.md"] },
      }),
    );
    const beforeRevision = before.data.task.revision;
    const beforeBrief = before.data.artifacts[0].content;
    const lock = await holdSqliteReadLock(
      path.join(fixture, ".planner-cache", "index.sqlite"),
      lockMilliseconds,
    );
    const startedAt = Date.now();
    const update = result(
      await client.callTool({
        name: "planner_task_update",
        arguments: updateArguments(beforeRevision, idempotencyKey, idempotencyKey),
      }),
    );
    const updateElapsedMilliseconds = Date.now() - startedAt;
    assert(
      update.data.taskRevision === beforeRevision + 1,
      "Lock canary revision did not advance once",
    );
    const canonical = result(
      await client.callTool({
        name: "planner_get_execution_context",
        arguments: { itemId: "ACCEPT-001", artifacts: ["BRIEF.md"] },
      }),
    );
    assert(
      canonical.data.task.revision === beforeRevision + 1,
      "Canonical readback revision mismatch",
    );
    assert(
      count(canonical.data.artifacts[0].content, `Criterion ${idempotencyKey}`) === 1,
      "Canonical lock-canary value was not rendered exactly once",
    );
    assert(
      canonical.data.artifacts[0].content !== beforeBrief,
      "Canonical Markdown did not change under the SQLite read lock",
    );
    const lockedRead = result(
      await client.callTool({ name: "planner_get_current", arguments: {} }),
    );
    if (expectImmediateIndex) {
      await lock.released;
      assert(
        updateElapsedMilliseconds >= lockMilliseconds - 100 && updateElapsedMilliseconds < 1_500,
        `Short-lock retry was not bounded: ${updateElapsedMilliseconds}ms`,
      );
      assert(lockedRead.data.index.available, "Short-lock index did not become available");
      assert(
        lockedRead.data.index.fingerprint === (await canonicalFingerprint()),
        "Short-lock index fingerprint is stale",
      );
    } else {
      assert(
        updateElapsedMilliseconds >= 900 && updateElapsedMilliseconds < lockMilliseconds,
        `Long-lock fallback was not bounded: ${updateElapsedMilliseconds}ms`,
      );
      assert(!lockedRead.data.index.available, "Long-lock index unexpectedly remained available");
      assert(!lockedRead.data.index.recoveryRequired, "Long-lock index requested recovery");
      await lock.released;
    }
    const rebuilt = expectImmediateIndex
      ? lockedRead
      : result(await client.callTool({ name: "planner_get_current", arguments: {} }));
    assert(rebuilt.data.index.available, "Index did not rebuild after lock release");
    assert(!rebuilt.data.index.recoveryRequired, "Rebuilt index requested recovery");
    assert(
      rebuilt.data.index.fingerprint === (await canonicalFingerprint()),
      "Rebuilt index fingerprint is stale",
    );
    const journals = (await new MarkdownStore(fixture).listOperationJournals()).filter(
      (journal) => journal.idempotencyKey === idempotencyKey,
    );
    assert(journals.length === 1, `Expected one ${idempotencyKey} journal, got ${journals.length}`);
    assert(journals[0].state === "committed", `${idempotencyKey} journal is not committed`);
    return {
      sqliteReadLockMilliseconds: lockMilliseconds,
      updateElapsedMilliseconds,
      canonicalRevision: canonical.data.task.revision,
      canonicalMutationCount: 1,
      committedJournals: journals.length,
      indexAvailableAfterRelease: rebuilt.data.index.available,
      indexCurrentAfterRelease: true,
      ...(expectImmediateIndex
        ? {
            boundedRetrySucceeded: true,
            indexAvailableAfterBoundedRetry: lockedRead.data.index.available,
            indexCurrentAfterBoundedRetry: true,
          }
        : {
            indexAvailableWhileLocked: lockedRead.data.index.available,
            recoveryRequiredWhileLocked: lockedRead.data.index.recoveryRequired,
          }),
    };
  } finally {
    await close();
  }
}

async function canonicalFingerprint() {
  const store = new MarkdownStore(fixture);
  return store.canonicalFingerprint(await store.loadConfig());
}

async function verifyExistingUi() {
  const preview = await startPlannerPreview({ root: projectRoot, port: 0, host: "127.0.0.1" });
  try {
    const [health, rootResponse, taskResponse] = await Promise.all([
      fetch(`${preview.url}/healthz`),
      fetch(preview.url),
      fetch(`${preview.url}/task/ABI-013`),
    ]);
    const [healthBody, rootHtml, taskHtml] = await Promise.all([
      health.json(),
      rootResponse.text(),
      taskResponse.text(),
    ]);
    assert(health.ok && healthBody.ok && healthBody.readOnly, "Planner UI health failed");
    assert(
      rootResponse.ok && rootHtml.includes("ABI-008"),
      "Planner UI did not read current canonical state",
    );
    assert(
      taskResponse.ok && taskHtml.includes("ABI-013") && taskHtml.includes("Done"),
      "Planner UI did not read the completed canonical task",
    );
    assert(
      rootHtml.includes("new EventSource('/events')"),
      "Planner UI refresh subscription is absent",
    );
    const refresh = await verifyUiRefreshEvent();
    return {
      health: 200,
      currentTask: "ABI-008",
      completedTask: "ABI-013",
      refreshSubscription: true,
      ...refresh,
    };
  } finally {
    await preview.close();
  }
}

async function verifyUiRefreshEvent() {
  const preview = await startPlannerPreview({ root: fixture, port: 0, host: "127.0.0.1" });
  const abort = new AbortController();
  try {
    const events = await fetch(`${preview.url}/events`, { signal: abort.signal });
    assert(events.ok && events.body, "Planner UI event stream did not open");
    const reader = events.body.getReader();
    const initial = new TextDecoder().decode((await reader.read()).value);
    assert(initial.includes("retry: 2000"), "Planner UI event stream did not initialize");
    const brief = await fixtureBrief();
    const expectedRevision = Number(brief.match(/^revision: (\d+)$/m)?.[1]);
    const { client, close } = await connect("autobattleidle-planner-ui-refresh");
    try {
      result(
        await client.callTool({
          name: "planner_task_update",
          arguments: {
            itemId: "ACCEPT-001",
            expectedRevision,
            idempotencyKey: "accept-ui-refresh",
            agentId: "acceptance-agent",
            sessionId: "acceptance-session",
            title: "UI refresh confirmed",
          },
        }),
      );
    } finally {
      await close();
    }
    let eventText = "";
    const deadline = Date.now() + 3_000;
    while (!eventText.includes("data: reload") && Date.now() < deadline) {
      const chunk = await Promise.race([
        reader.read(),
        new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 500)),
      ]);
      if (chunk.timeout) continue;
      eventText += new TextDecoder().decode(chunk.value);
    }
    assert(
      eventText.includes("data: reload"),
      "Planner UI did not emit a canonical-state reload event",
    );
    const refreshed = await (await fetch(`${preview.url}/task/ACCEPT-001`)).text();
    assert(
      refreshed.includes("UI refresh confirmed"),
      "Planner UI did not read refreshed canonical state",
    );
    return { refreshEventObserved: true, refreshedStateRead: true };
  } finally {
    abort.abort();
    await preview.close();
  }
}

async function connect(name, root = fixture) {
  const env = {
    ...process.env,
    PLANNER_PROJECT_ROOT: root,
    PLANNER_CONSUMER_PROJECT_ROOT: root,
    PLANNER_STORAGE_MODE: "in-repo",
    PLANNER_TRACKER_EXTENDED: "0",
    NODE_NO_WARNINGS: "1",
  };
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverEntrypoint],
    cwd: root,
    env,
    stderr: "inherit",
  });
  const client = new Client({ name, version: "1.0.0" });
  await client.connect(transport);
  return { client, close: () => client.close() };
}

function updateArguments(expectedRevision, idempotencyKey, value) {
  return {
    itemId: "ACCEPT-001",
    expectedRevision,
    idempotencyKey,
    agentId: "acceptance-agent",
    sessionId: "acceptance-session",
    acceptanceCriteria: [`Criterion ${value}`, `Criterion ${value}`],
    dependsOn: [],
    relatedKnowledge: [`VAULT-${value}`, `VAULT-${value}`],
  };
}

async function fixtureBrief() {
  return readFile(await fixtureBriefPath(), "utf8");
}

async function fixtureBriefPath() {
  const sprint = path.join(fixture, "plans", "sprint-ACCEPT-S1-planner-consumer-acceptance");
  const entries = await readdir(sprint, { withFileTypes: true });
  const task = entries.find(
    (entry) => entry.isDirectory() && entry.name.startsWith("task-ACCEPT-001-"),
  );
  assert(task, "Fixture task packet is missing");
  return path.join(sprint, task.name, "BRIEF.md");
}

async function holdExclusiveLock(file, milliseconds) {
  const command =
    "$stream = [System.IO.File]::Open($env:ABI_PLANNER_LOCK_TARGET, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::None); [Console]::Out.WriteLine('locked'); Start-Sleep -Milliseconds ([int]$env:ABI_PLANNER_LOCK_MS); $stream.Dispose()";
  const child = spawn("pwsh", ["-NoProfile", "-Command", command], {
    cwd: fixture,
    windowsHide: true,
    env: {
      ...process.env,
      ABI_PLANNER_LOCK_TARGET: file,
      ABI_PLANNER_LOCK_MS: String(milliseconds),
    },
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => (stdout += chunk));
  child.stderr.on("data", (chunk) => (stderr += chunk));
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Exclusive lock did not initialize")), 3_000);
    child.stdout.on("data", () => {
      if (!stdout.includes("locked")) return;
      clearTimeout(timeout);
      resolve();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (!stdout.includes("locked")) reject(new Error(stderr || `Lock process exited ${code}`));
    });
  });
  return {
    released: new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr))));
    }),
  };
}

async function holdSqliteReadLock(file, milliseconds) {
  const child = spawn(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `import { DatabaseSync } from "node:sqlite"; const database = new DatabaseSync(process.argv[1], { readOnly: true }); database.prepare("SELECT value FROM meta WHERE key = 'canonicalFingerprint'").get(); process.stdout.write("locked\\n"); setTimeout(() => database.close(), Number(process.argv[2]));`,
      file,
      String(milliseconds),
    ],
    { cwd: fixture, env: process.env, windowsHide: true },
  );
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => (stdout += chunk));
  child.stderr.on("data", (chunk) => (stderr += chunk));
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("SQLite read lock did not initialize")),
      3_000,
    );
    child.stdout.on("data", () => {
      if (!stdout.includes("locked")) return;
      clearTimeout(timeout);
      resolve();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (!stdout.includes("locked")) reject(new Error(stderr || `SQLite lock exited ${code}`));
    });
  });
  return {
    released: new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr))));
    }),
  };
}

async function findTransientFiles(root) {
  const found = [];
  for (const entry of await readdir(root, { recursive: true, withFileTypes: true }))
    if (entry.name.includes(".planner-tmp-") || entry.name.includes(".write-"))
      found.push(entry.name);
  return found;
}

function result(call) {
  const payload = call.structuredContent?.result;
  assert(
    payload?.ok,
    `Planner call failed: ${JSON.stringify(call.structuredContent ?? call.content)}`,
  );
  return payload;
}

function count(value, needle) {
  return value.split(needle).length - 1;
}

function equal(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function assertRejects(operation, expectedMessage) {
  try {
    await operation();
  } catch (error) {
    if (error instanceof Error && error.message.includes(expectedMessage)) return;
    throw error;
  }
  throw new Error(`Expected rejection containing: ${expectedMessage}`);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: projectRoot, env: process.env, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve(stdout) : reject(new Error(stderr || stdout)),
    );
  });
}
