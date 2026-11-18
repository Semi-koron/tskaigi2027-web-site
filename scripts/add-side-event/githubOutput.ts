import { randomUUID } from "node:crypto";

/**
 * $GITHUB_OUTPUTに書き込む形式にする．
 * 値に改行が含まれても別の出力を差し込めないよう，推測できない区切り文字を使う．
 */
export const formatGithubOutput = (name: string, value: string): string => {
  const delimiter = `ghadelimiter_${randomUUID()}`;
  return `${name}<<${delimiter}\n${value}\n${delimiter}\n`;
};
