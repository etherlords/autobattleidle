import { execFileSync } from "node:child_process";
import { Buffer } from "node:buffer";
import {
  chmodSync,
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "autobattleidle-hooks-"));
const repository = join(temp, "repository");
const bin = join(temp, "bin");
const pnpm = join(bin, "pnpm");
let stagedBefore = "";

function run(command, args, options = {}) {
  return execFileSync(command, args, { cwd: repository, encoding: "utf8", ...options });
}

function expectNoCommit() {
  try {
    run("git", ["rev-parse", "--verify", "HEAD"], { stdio: "pipe" });
    throw new Error("Hook smoke unexpectedly created a commit.");
  } catch (error) {
    if (error.status !== 128) throw error;
  }
}

function expectNoStagedChanges() {
  if (run("git", ["diff", "--cached", "--binary"]) !== stagedBefore) {
    throw new Error("Hook smoke unexpectedly changed the index.");
  }
}

function runHook(exitCode) {
  writeFileSync(pnpm, `#!/bin/sh\nexit ${exitCode}\n`, "utf8");
  chmodSync(pnpm, 0o755);
  try {
    run("git", ["hook", "run", "pre-commit"], { env: environment, stdio: "pipe" });
    if (exitCode !== 0) throw new Error("Failing pnpm check did not block the hook.");
  } catch (error) {
    if (exitCode === 0) throw error;
    if (error.status !== 1 || !String(error.stderr).includes("pnpm check")) throw error;
  }
  expectNoCommit();
  expectNoStagedChanges();
}

const environment = {
  ...process.env,
  PATH: `${bin}${process.platform === "win32" ? ";" : ":"}${process.env.PATH}`,
};

try {
  mkdirSync(repository);
  mkdirSync(bin);
  run("git", ["init", "--quiet"]);
  run("git", ["config", "core.autocrlf", "true"]);
  mkdirSync(join(repository, ".githooks"));
  cpSync(join(root, ".gitattributes"), join(repository, ".gitattributes"));
  cpSync(join(root, ".githooks", "pre-commit"), join(repository, ".githooks", "pre-commit"));
  run("git", ["add", ".gitattributes", ".githooks/pre-commit"]);
  run("git", ["update-index", "--chmod=+x", ".githooks/pre-commit"]);
  if (!run("git", ["ls-files", "--stage", ".githooks/pre-commit"]).startsWith("100755 ")) {
    throw new Error("Hook index mode is not 100755.");
  }
  run("git", ["checkout-index", "--force", ".githooks/pre-commit"]);
  const hook = readFileSync(join(repository, ".githooks", "pre-commit"));
  if (!hook.subarray(0, 10).equals(Buffer.from("#!/bin/sh\n")) || hook.includes(13)) {
    throw new Error("Hook checkout did not preserve the LF shebang.");
  }
  stagedBefore = run("git", ["diff", "--cached", "--binary"]);

  execFileSync(process.execPath, [join(root, "scripts", "install-git-hooks.mjs")], {
    cwd: repository,
    stdio: "inherit",
  });
  if (run("git", ["config", "--local", "--get", "core.hooksPath"]).trim() !== ".githooks") {
    throw new Error("Hook installer did not configure .githooks.");
  }
  execFileSync(process.execPath, [join(root, "scripts", "install-git-hooks.mjs")], {
    cwd: repository,
    stdio: "inherit",
  });

  expectNoCommit();
  expectNoStagedChanges();
  runHook(1);
  runHook(0);
  process.stdout.write("Git hook smoke passed: red blocked, green permitted, no commit created.\n");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
