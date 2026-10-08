// The weekly release run (.github/workflows/release.yml, Mondays 04:30 UTC).
// For each package, if the version in its package.json on main isn't on npm
// yet, it stages that version through the package's own publish workflow (npm's
// Trusted Publisher only accepts publish-cli.yml and publish-elements.yml), then
// opens one "Releases to approve" issue with the approve command for each (or
// comments on the one still open). If no version is new, it does nothing.
// Needs GH_TOKEN (actions: write, issues: write) and GH_REPO. Run from anywhere:
//   node crate/scripts/weekly-release.mjs [--dry-run]
// --dry-run prints what it would stage and the changes, and stages nothing.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const dryRun = process.argv.includes("--dry-run");

const packages = [
  {
    dir: "crate/cli",
    workflow: "publish-cli.yml",
    // What ships in the package: changes anywhere else don't change it.
    paths: ["crate/cli"],
  },
  {
    dir: "crate/elements",
    workflow: "publish-elements.yml",
    // The elements bundle the React components and read their props from the
    // docs data, so changes there ship too.
    paths: ["crate/elements", "crate/components/agent-wait-states", "crate/lib/docs.generated.json"],
  },
];

const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: "utf8" }).trim();
const tryRun = (cmd, args) => {
  const result = spawnSync(cmd, args, { cwd: root, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The commit that set package.json to this version: changes after it are new.
function releaseCommit(pkg, version) {
  const commits = run("git", ["log", "--format=%H", `-S"version": "${version}"`, "--", `${pkg.dir}/package.json`]).split("\n").filter(Boolean);
  return commits.at(-1);
}

function changesSince(pkg, published) {
  const from = published && releaseCommit(pkg, published);
  if (!from) return ["- First release, or the commit of the last one wasn't found: see the package's history."];
  const lines = run("git", ["log", "--no-merges", "--format=- %s", `${from}..HEAD`, "--", ...pkg.paths]).split("\n").filter(Boolean);
  return lines.length ? lines : ["- No changes to the package's files (version bump only)."];
}

// Starts the publish workflow with a unique request ID, which the workflow puts
// in its run name, so the run can be found again.
async function stage(pkg) {
  const requestId = `weekly-${process.env.GITHUB_RUN_ID ?? Date.now()}-${pkg.dir.split("/").pop()}`;
  run("gh", ["workflow", "run", pkg.workflow, "--ref", "main", "-f", "mode=stage", "-f", `request_id=${requestId}`]);
  let runId;
  for (let attempt = 0; attempt < 30 && !runId; attempt++) {
    await sleep(5000);
    const runs = JSON.parse(run("gh", ["run", "list", "--workflow", pkg.workflow, "--event", "workflow_dispatch", "--limit", "20", "--json", "databaseId,displayTitle"]));
    runId = runs.find((r) => r.displayTitle.includes(requestId))?.databaseId;
  }
  if (!runId) return { ok: false, detail: `the ${pkg.workflow} run didn't start` };
  const url = run("gh", ["run", "view", String(runId), "--json", "url", "--jq", ".url"]);
  const watched = spawnSync("gh", ["run", "watch", String(runId), "--exit-status", "--interval", "15"], { cwd: root, stdio: "inherit" });
  if (watched.status !== 0) return { ok: false, url, detail: "the run failed" };
  const dir = mkdtempSync(join(tmpdir(), "stage-info-"));
  run("gh", ["run", "download", String(runId), "--name", "stage-info", "--dir", dir]);
  const info = JSON.parse(readFileSync(join(dir, "stage.json"), "utf8"));
  return { ok: true, url, stageId: info.stageId };
}

const sections = [];
let staged = 0;
for (const pkg of packages) {
  const { name, version } = JSON.parse(readFileSync(join(root, pkg.dir, "package.json"), "utf8"));
  if (tryRun("npm", ["view", `${name}@${version}`, "version"])) {
    console.log(`${name}@${version} is already on npm: nothing to stage.`);
    continue;
  }
  const published = tryRun("npm", ["view", name, "version"]);
  const changes = changesSince(pkg, published);
  console.log(`${name}@${version} is not on npm yet (latest: ${published || "none"}). Changes:\n${changes.join("\n")}`);
  if (dryRun) continue;

  const result = await stage(pkg).catch((error) => ({ ok: false, detail: `the weekly run hit an error (${error.message.split("\n")[0]})` }));
  const lines = [`## ${name}@${version}`, "", `Last release: ${published || "none"}.`, "", "What changed:", "", ...changes, ""];
  if (result.ok) {
    staged++;
    lines.push(
      result.stageId
        ? `Approve (2FA): \`npm stage approve ${result.stageId}\`, or approve the staged ${version} on npmjs.com.`
        : `Staged, but the stage ID wasn't found in the run: approve the staged ${version} on npmjs.com.`,
      "",
      `Inspect it first: \`npm stage download ${result.stageId ?? "<stage-id>"}\`. Discard it: \`npm stage reject ${result.stageId ?? "<stage-id>"}\`.`,
      "",
      `Run: ${result.url}`,
    );
  } else {
    lines.push(
      `Not staged: ${result.detail}.${result.url ? ` Run: ${result.url}` : ""}`,
      "",
      "If the run says the version already exists, it was staged earlier and is still waiting for approval (or was rejected): approve or reject it on npmjs.com, or bump the version.",
    );
  }
  sections.push(lines.join("\n"));
}

if (dryRun) process.exit(0);
if (!sections.length) {
  console.log("No new versions: no issue opened.");
  process.exit(0);
}

const body = [
  `The weekly release run staged ${staged} of ${sections.length} new version${sections.length === 1 ? "" : "s"}. Nothing is installable until it is approved.`,
  "",
  ...sections,
  "",
  `Weekly release run: ${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
].join("\n");
const file = join(mkdtempSync(join(tmpdir(), "release-issue-")), "issue.md");
writeFileSync(file, body);
// One open issue at a time, like the live check: if last week's is still open,
// this week's releases go into it as a comment.
const title = "Releases to approve";
const open = JSON.parse(run("gh", ["issue", "list", "--state", "open", "--label", "human", "--search", `"${title}" in:title`, "--json", "number,title"]));
const existing = open.find((issue) => issue.title === title)?.number;
console.log(
  existing
    ? run("gh", ["issue", "comment", String(existing), "--body-file", file])
    : run("gh", ["issue", "create", "--title", title, "--label", "human", "--body-file", file]),
);
// A failed stage fails the run too, so it shows up in the Actions tab.
if (staged < sections.length) process.exit(1);
