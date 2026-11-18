import assert from "node:assert/strict";
import { test } from "node:test";
import { formatGithubOutput } from "./githubOutput.ts";

test("改行を含む値も1つの出力として書ける形式にする", () => {
  const output = formatGithubOutput("name", "1行目\nother=injected");
  const match = /^name<<(\S+)\n([\s\S]*)\n\1\n$/.exec(output);
  assert.ok(match, output);
  assert.equal(match[2], "1行目\nother=injected");
});

test("区切り文字を推測できないよう毎回変える", () => {
  const delimiterOf = (output: string) => output.split("\n")[0];
  assert.notEqual(
    delimiterOf(formatGithubOutput("name", "value")),
    delimiterOf(formatGithubOutput("name", "value")),
  );
});
