import {
  type SideEvent,
  sideEventSchema,
} from "../../src/schemas/sideEvent.ts";

/** issueフォーム（.github/ISSUE_TEMPLATE/side-event.yml）の各項目の見出し */
export const LABELS = {
  link: "ConnpassイベントURL",
  thumbnail: "ConnpassサムネイルURL",
  name: "イベント名",
  date: "開催日",
  endTime: "終了時刻（任意）",
  sponsors: "主催スポンサー",
  detail: "イベント詳細",
  tags: "タグ（任意）",
} as const;

/** issueフォームで任意項目が未入力のときに入る文字列 */
const NO_RESPONSE = "_No response_";

export const DETAIL_PLACEHOLDER = "イベント詳細をここに入力してください";

/**
 * issueフォームの本文を「見出し → 値」に分解する．
 * 区切りとして扱うのは，フォームの項目名と一致し，まだ出てきていない見出しだけにする．
 * イベント詳細にMarkdownの見出しが含まれていても，値が途中で切れたり他の項目を上書きしたりしないようにするため．
 * Slackのワークフローなどから起票されたissueも扱えるよう，見出しは ## と ### の両方を受け付ける．
 */
export const parseIssueForm = (
  body: string,
  labels: readonly string[] = Object.values(LABELS),
): Map<string, string> => {
  const knownLabels = new Set(labels);
  const fields = new Map<string, string>();
  let label: string | undefined;
  let lines: string[] = [];

  const flush = () => {
    if (label === undefined) {
      return;
    }
    const value = lines.join("\n").trim();
    fields.set(label, value === NO_RESPONSE ? "" : value);
  };

  for (const line of body.replaceAll("\r\n", "\n").split("\n")) {
    const heading = /^#{2,3}\s+(.+?)\s*$/.exec(line)?.[1];
    if (
      heading !== undefined &&
      knownLabels.has(heading) &&
      !fields.has(heading) &&
      heading !== label
    ) {
      flush();
      label = heading;
      lines = [];
    } else {
      lines.push(line);
    }
  }
  flush();

  return fields;
};

const END_TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/**
 * 終了日時を求める．
 * 終了時刻（H:MM / HH:MM）があれば開催日のその時刻，なければ開催日の翌日0:00にする（いずれも日本時間）．
 */
export const calcFinishedAt = (date: string, endTime: string): string => {
  if (endTime !== "") {
    const match = END_TIME_PATTERN.exec(endTime);
    if (!match) {
      throw new Error(
        `終了時刻はHH:MM形式で指定してください: ${JSON.stringify(endTime)}`,
      );
    }
    const [, hour = "", minute = ""] = match;
    return `${date}T${hour.padStart(2, "0")}:${minute}:00+09:00`;
  }

  const [year, month, day] = date.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
  return `${nextDay.toISOString().slice(0, 10)}T00:00:00+09:00`;
};

const splitList = (value: string): string[] =>
  value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter((item) => item !== "");

/**
 * Issueを閉じるキーワード（closes #1，fixes owner/repo#1，resolves <issueのURL> など）．
 * イベント名はPRの本文とコミットメッセージに入るため，含まれているとマージ時に無関係なIssueが閉じられる
 */
const CLOSING_KEYWORD_PATTERN =
  /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\b:?\s*(?:[\w.-]+\/[\w.-]+)?(?:#\d+|https?:\/\/\S+\/(?:issues|pull)\/\d+)/i;

/** 項目の値を検証し，問題があれば項目名に続けるエラーメッセージを返す */
type Validate = (value: string) => string | undefined;

const required: Validate = (value) =>
  value === "" ? "が入力されていません" : undefined;

/** データの形式はsideEventSchema（src/schemas/sideEvent.ts）の各項目で検証する */
const matchesSchema =
  (field: keyof typeof sideEventSchema.shape, message: string): Validate =>
  (value) =>
    required(value) ??
    (sideEventSchema.shape[field].safeParse(value).success
      ? undefined
      : message);

/** 1行で入力する項目．改行が入るとPRのタイトルや本文に別の行を差し込めてしまう */
const SINGLE_LINE_FIELDS: readonly [label: string, validate: Validate][] = [
  [LABELS.link, matchesSchema("link", "はhttpsのURLを入力してください")],
  [
    LABELS.thumbnail,
    matchesSchema("thumbnail", "はhttpsのURLを入力してください"),
  ],
  [
    LABELS.name,
    (value) =>
      required(value) ??
      (CLOSING_KEYWORD_PATTERN.test(value)
        ? // エラー文はissueにコメントされるので，#1へのリンクにならないようコード表記にする
          "にIssueを閉じるキーワード（`closes #1` など）は使えません"
        : undefined),
  ],
  [
    LABELS.date,
    matchesSchema("date", "は存在する日付をYYYY-MM-DD形式で入力してください"),
  ],
  [
    LABELS.endTime,
    (value) =>
      value === "" || END_TIME_PATTERN.test(value)
        ? undefined
        : "はHH:MM形式で入力してください",
  ],
  [
    LABELS.sponsors,
    (value) =>
      splitList(value).length === 0 ? "が入力されていません" : undefined,
  ],
  [LABELS.tags, () => undefined],
];

export type BuildSideEventResult =
  { ok: true; sideEvent: SideEvent } | { ok: false; errors: string[] };

/** issueの本文を検証し，サイドイベントのデータを作る */
export const buildSideEventFromIssue = (body: string): BuildSideEventResult => {
  const fields = parseIssueForm(body);
  const get = (label: string): string => fields.get(label) ?? "";

  const errors = SINGLE_LINE_FIELDS.flatMap(([label, validate]) => {
    const value = get(label);
    const message = value.includes("\n")
      ? "は1行で入力してください"
      : validate(value);
    return message === undefined ? [] : [`${label}${message}`];
  });
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const date = get(LABELS.date);
  const detail = get(LABELS.detail);
  const tags = splitList(get(LABELS.tags));

  // 最後にschema全体で検証し，URLの正規化などを反映したデータを保存する
  const sideEvent = sideEventSchema.parse({
    date,
    name: get(LABELS.name),
    link: get(LABELS.link),
    thumbnail: get(LABELS.thumbnail),
    detail: detail === "" ? DETAIL_PLACEHOLDER : detail,
    ...(tags.length > 0 ? { tags } : {}),
    sponsors: splitList(get(LABELS.sponsors)),
    finishedAt: calcFinishedAt(date, get(LABELS.endTime)),
  });
  return { ok: true, sideEvent };
};

/**
 * 同じURLのイベントがあれば同じ位置で置き換え，なければ末尾に追加した新しい配列を返す．
 * 掲載済みのイベントのissueを編集したときに重複させないため．
 */
export const upsertSideEvent = (
  list: readonly SideEvent[],
  sideEvent: SideEvent,
): SideEvent[] => {
  const index = list.findIndex((event) => event.link === sideEvent.link);
  return index === -1 ? [...list, sideEvent] : list.with(index, sideEvent);
};
