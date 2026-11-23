import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { SideEvent } from "../../src/schemas/sideEvent.ts";
import {
  buildSideEventFromIssue,
  calcFinishedAt,
  parseIssueForm,
  upsertSideEvent,
} from "./sideEventIssue.ts";

/** GitHubのissueフォームが生成する本文を組み立てる */
const issueBody = (fields: Record<string, string>): string =>
  Object.entries(fields)
    .map(([label, value]) => `### ${label}\n\n${value}`)
    .join("\n\n");

const validFields = {
  ConnpassイベントURL: "https://typescript-jpc.connpass.com/event/379927/",
  ConnpassサムネイルURL:
    "https://media.connpass.com/thumbs/ad/6b/ad6b92024c9501d4f408977f8fed2406.png",
  イベント名: "TSKaigi Mashup #4 プロポーザルの書き方とコツを学ぼう",
  開催日: "2026-02-09",
  "終了時刻（任意）": "_No response_",
  主催スポンサー: "株式会社A, 株式会社B",
  イベント詳細: "1行目\n2行目",
  "タグ（任意）": "勉強会, CfP",
};

/** validFieldsのissueをparseIssueFormで分解した結果 */
const parsedValidFields = { ...validFields, "終了時刻（任意）": "" };

/** validFieldsのissueから，タグを未入力にしたときに作られるサイドイベント */
const validSideEventWithoutTags: SideEvent = {
  date: "2026-02-09",
  name: "TSKaigi Mashup #4 プロポーザルの書き方とコツを学ぼう",
  link: "https://typescript-jpc.connpass.com/event/379927/",
  thumbnail:
    "https://media.connpass.com/thumbs/ad/6b/ad6b92024c9501d4f408977f8fed2406.png",
  detail: "1行目\n2行目",
  sponsors: ["株式会社A", "株式会社B"],
  finishedAt: "2026-02-10T00:00:00+09:00",
};

/** validFieldsのissueから作られるサイドイベント */
const validSideEvent: SideEvent = {
  ...validSideEventWithoutTags,
  tags: ["勉強会", "CfP"],
};

const parse = (body: string) => Object.fromEntries(parseIssueForm(body));

describe("parseIssueForm", () => {
  test("見出しごとに値を取り出し，複数行の値は改行を保つ", () => {
    assert.deepEqual(parse(issueBody(validFields)), parsedValidFields);
  });

  test("未入力（_No response_）は空文字にする", () => {
    assert.deepEqual(
      parse(issueBody({ ...validFields, "タグ（任意）": "_No response_" })),
      { ...parsedValidFields, "タグ（任意）": "" },
    );
  });

  test("CRLFの改行も扱える", () => {
    assert.deepEqual(
      parse(issueBody(validFields).replaceAll("\n", "\r\n")),
      parsedValidFields,
    );
  });

  test("見出しが ## でも扱える", () => {
    assert.deepEqual(parse("## 開催日\n\n2026-02-09\n\n## イベント名\n\nA"), {
      開催日: "2026-02-09",
      イベント名: "A",
    });
  });

  test("フォームの項目名ではない見出しは値の一部として残す", () => {
    const detail = "概要です\n\n## タイムテーブル\n\n19:00 開場";
    assert.deepEqual(
      parse(issueBody({ ...validFields, イベント詳細: detail })),
      { ...parsedValidFields, イベント詳細: detail },
    );
  });

  test("すでに出てきた項目名の見出しは値の一部として扱い，上書きしない", () => {
    const detail =
      "概要です\n\n### ConnpassイベントURL\n\nhttps://evil.example/";
    assert.deepEqual(
      parse(issueBody({ ...validFields, イベント詳細: detail })),
      { ...parsedValidFields, イベント詳細: detail },
    );
  });
});

describe("calcFinishedAt", () => {
  test("終了時刻があれば開催日のその時刻（日本時間）を返す", () => {
    assert.equal(
      calcFinishedAt("2026-02-09", "21:30"),
      "2026-02-09T21:30:00+09:00",
    );
  });

  test("終了時刻の時が1桁でも2桁にそろえる", () => {
    assert.equal(
      calcFinishedAt("2026-02-09", "9:05"),
      "2026-02-09T09:05:00+09:00",
    );
  });

  test("終了時刻が無ければ開催日の翌日0:00（日本時間）を返す", () => {
    assert.equal(calcFinishedAt("2026-05-22", ""), "2026-05-23T00:00:00+09:00");
  });

  test("月末・年末をまたげる", () => {
    assert.equal(calcFinishedAt("2026-01-31", ""), "2026-02-01T00:00:00+09:00");
    assert.equal(calcFinishedAt("2026-12-31", ""), "2027-01-01T00:00:00+09:00");
  });
});

describe("buildSideEventFromIssue", () => {
  const build = (override: Partial<Record<keyof typeof validFields, string>>) =>
    buildSideEventFromIssue(issueBody({ ...validFields, ...override }));

  test("issueの本文からサイドイベントを作る", () => {
    assert.deepEqual(build({}), { ok: true, sideEvent: validSideEvent });
  });

  test("終了時刻があれば終了日時に使う", () => {
    assert.deepEqual(build({ "終了時刻（任意）": "21:30" }), {
      ok: true,
      sideEvent: { ...validSideEvent, finishedAt: "2026-02-09T21:30:00+09:00" },
    });
  });

  test("終了時刻がHH:MM形式でなければエラーにする", () => {
    for (const endTime of ["25:00", "21時30分", "21:3"]) {
      assert.deepEqual(
        build({ "終了時刻（任意）": endTime }),
        {
          ok: false,
          errors: ["終了時刻（任意）はHH:MM形式で入力してください"],
        },
        endTime,
      );
    }
  });

  test("1行で入力する項目に改行があればエラーにする（PRの本文への差し込みを防ぐ）", () => {
    assert.deepEqual(
      build({
        ConnpassイベントURL: "https://a.example/\nCloses #1",
        イベント名: "A\n@org/team",
        主催スポンサー: "株式会社A\n株式会社B",
      }),
      {
        ok: false,
        errors: [
          "ConnpassイベントURLは1行で入力してください",
          "イベント名は1行で入力してください",
          "主催スポンサーは1行で入力してください",
        ],
      },
    );
  });

  test("イベント名にIssueを閉じるキーワードがあればエラーにする（PRのマージで無関係なIssueが閉じられるのを防ぐ）", () => {
    for (const name of [
      "TSKaigi Mashup #4 closes #3",
      "Fixes: owner/repo#12 勉強会",
      "勉強会 resolved https://github.com/owner/repo/issues/1",
    ]) {
      assert.deepEqual(
        build({ イベント名: name }),
        {
          ok: false,
          errors: [
            "イベント名にIssueを閉じるキーワード（`closes #1` など）は使えません",
          ],
        },
        name,
      );
    }
  });

  test("Issue番号を伴わないキーワードやメンションのような文字列は通す", () => {
    for (const name of [
      "TSKaigi Mashup #4 Bug Fixes 勉強会",
      "TSKaigi@Kansai prefix #4",
    ]) {
      assert.deepEqual(
        build({ イベント名: name }),
        { ok: true, sideEvent: { ...validSideEvent, name } },
        name,
      );
    }
  });

  test("URLは正規化して保存する", () => {
    assert.deepEqual(
      build({
        ConnpassイベントURL:
          "HTTPS://TypeScript-JPC.connpass.com/event/379927/",
      }),
      { ok: true, sideEvent: validSideEvent },
    );
  });

  test("全角カンマでも区切れる", () => {
    assert.deepEqual(build({ 主催スポンサー: "株式会社A，株式会社B" }), {
      ok: true,
      sideEvent: validSideEvent,
    });
  });

  test("タグが未入力ならtagsを持たない", () => {
    assert.deepEqual(build({ "タグ（任意）": "_No response_" }), {
      ok: true,
      sideEvent: validSideEventWithoutTags,
    });
  });

  test("詳細が未入力ならPRで手入力するためのプレースホルダーを入れる", () => {
    assert.deepEqual(build({ イベント詳細: "_No response_" }), {
      ok: true,
      sideEvent: {
        ...validSideEvent,
        detail: "イベント詳細をここに入力してください",
      },
    });
  });

  test("必須項目が未入力ならすべてのエラーを返す", () => {
    assert.deepEqual(
      build({
        ConnpassイベントURL: "_No response_",
        ConnpassサムネイルURL: "_No response_",
        イベント名: "_No response_",
        開催日: "_No response_",
        主催スポンサー: " , ",
      }),
      {
        ok: false,
        errors: [
          "ConnpassイベントURLが入力されていません",
          "ConnpassサムネイルURLが入力されていません",
          "イベント名が入力されていません",
          "開催日が入力されていません",
          "主催スポンサーが入力されていません",
        ],
      },
    );
  });

  test("https以外のURLや空白を含むURLはエラーにする", () => {
    for (const [link, thumbnail] of [
      ["javascript:alert(1)", "not a url"],
      // httpの画像はhttpsのサイトで混在コンテンツになる
      ["http://a.example/", "http://a.example/a.png"],
      // URLの解析では空白がエンコードされて通ってしまう
      ["https://a.example/ Fixes #2", "https://a.example/a b.png"],
    ] as const) {
      assert.deepEqual(
        build({ ConnpassイベントURL: link, ConnpassサムネイルURL: thumbnail }),
        {
          ok: false,
          errors: [
            "ConnpassイベントURLはhttpsのURLを入力してください",
            "ConnpassサムネイルURLはhttpsのURLを入力してください",
          ],
        },
        link,
      );
    }
  });

  test("開催日がYYYY-MM-DD形式でなければエラーにする", () => {
    assert.deepEqual(build({ 開催日: "2026/02/09" }), {
      ok: false,
      errors: ["開催日は存在する日付をYYYY-MM-DD形式で入力してください"],
    });
  });

  test("存在しない開催日や，表示できない0〜99年の開催日はエラーにする", () => {
    for (const date of ["2026-02-30", "0026-02-09"]) {
      assert.deepEqual(
        build({ 開催日: date }),
        {
          ok: false,
          errors: ["開催日は存在する日付をYYYY-MM-DD形式で入力してください"],
        },
        date,
      );
    }
  });
});

describe("upsertSideEvent", () => {
  const sideEvent = (name: string, link: string): SideEvent => ({
    date: "2026-02-09",
    name,
    link,
    thumbnail: "https://example.com/thumbnail.png",
    detail: "detail",
    sponsors: ["TSKaigi"],
    finishedAt: "2026-02-10T00:00:00+09:00",
  });
  const a = sideEvent("A", "https://example.com/a");
  const b = sideEvent("B", "https://example.com/b");
  const c = sideEvent("C", "https://example.com/c");

  test("新しいイベントは末尾に追加する", () => {
    assert.deepEqual(upsertSideEvent([a, b], c), [a, b, c]);
  });

  test("同じURLのイベントは同じ位置で置き換える（issueの編集に対応）", () => {
    const fixedA = sideEvent("A（修正）", "https://example.com/a");
    assert.deepEqual(upsertSideEvent([a, b], fixedA), [fixedA, b]);
  });

  test("元の配列を変更しない", () => {
    const list = [a, b];
    upsertSideEvent(list, c);
    assert.deepEqual(list, [a, b]);
  });
});
