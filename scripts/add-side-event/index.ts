/**
 * issue（.github/ISSUE_TEMPLATE/side-event.yml）の本文からサイドイベントを作り，sideEvents.jsonに追加する．
 * .github/workflows/add-side-event.ymlから実行する．
 *
 * 使い方: ISSUE_BODY="<issueの本文>" node scripts/add-side-event/index.ts
 */
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import type { SideEvent } from "../../src/schemas/sideEvent.ts";
import { formatGithubOutput } from "./githubOutput.ts";
import { buildSideEventFromIssue, upsertSideEvent } from "./sideEventIssue.ts";

const DATA_FILE = new URL(
  "../../src/constants/sideEvents.json",
  import.meta.url,
);

const setOutput = (name: string, value: string) => {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    appendFileSync(outputFile, formatGithubOutput(name, value));
  }
};

const result = buildSideEventFromIssue(process.env.ISSUE_BODY ?? "");
if (!result.ok) {
  const errors = result.errors.map((error) => `- ${error}`).join("\n");
  console.error(`入力内容にエラーがあります．\n${errors}`);
  setOutput("errors", errors);
  process.exit(1);
}

const { sideEvent } = result;
const sideEvents = JSON.parse(readFileSync(DATA_FILE, "utf8")) as SideEvent[];
writeFileSync(
  DATA_FILE,
  `${JSON.stringify(upsertSideEvent(sideEvents, sideEvent), null, 2)}\n`,
);
console.log("sideEvents.jsonを更新しました．", sideEvent);

setOutput("name", sideEvent.name);
setOutput("date", sideEvent.date);
setOutput("link", sideEvent.link);
setOutput("finishedAt", sideEvent.finishedAt);
