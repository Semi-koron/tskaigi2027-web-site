import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { type SideEvent, sideEventSchema } from "./sideEvent.ts";

const validSideEventWithoutTags: SideEvent = {
  date: "2026-02-09",
  name: "TSKaigi Mashup #4 プロポーザルの書き方とコツを学ぼう",
  link: "https://typescript-jpc.connpass.com/event/379927/",
  thumbnail:
    "https://media.connpass.com/thumbs/ad/6b/ad6b92024c9501d4f408977f8fed2406.png",
  detail: "1行目\n2行目",
  sponsors: ["TSKaigi"],
  finishedAt: "2026-02-09T21:30:00+09:00",
};

const validSideEvent: SideEvent = {
  ...validSideEventWithoutTags,
  tags: ["勉強会", "CfP"],
};

const isValid = (override: Partial<Record<keyof SideEvent, unknown>>) =>
  sideEventSchema.safeParse({ ...validSideEvent, ...override }).success;

describe("sideEventSchema", () => {
  test("正しいデータはそのまま通す", () => {
    assert.deepEqual(sideEventSchema.parse(validSideEvent), validSideEvent);
  });

  test("タグは省略できる", () => {
    assert.deepEqual(
      sideEventSchema.parse(validSideEventWithoutTags),
      validSideEventWithoutTags,
    );
  });

  test("必須の文字列や主催が空ならエラーにする", () => {
    assert.equal(isValid({ name: "" }), false);
    assert.equal(isValid({ sponsors: [] }), false);
    assert.equal(isValid({ sponsors: [""] }), false);
  });

  describe("date", () => {
    test("YYYY-MM-DD以外や存在しない日付はエラーにする", () => {
      assert.equal(isValid({ date: "2026/02/09" }), false);
      assert.equal(isValid({ date: "2026-02-30" }), false);
    });

    test("うるう日は通す", () => {
      assert.equal(isValid({ date: "2028-02-29" }), true);
    });

    test("形式が正しくない日付のエラーは1件だけにする（同じ文を重ねて表示しない）", () => {
      for (const date of ["2026/02/09", "2026-02-30"]) {
        const result = sideEventSchema.safeParse({ ...validSideEvent, date });
        assert.equal(result.error?.issues.length, 1, date);
      }
    });

    test("表示用の日付処理（formatSideEventDate）が扱えない0〜99年はエラーにする", () => {
      assert.equal(isValid({ date: "0026-02-09" }), false);
    });
  });

  describe("finishedAt", () => {
    test("タイムゾーン付きのISO 8601なら通す", () => {
      assert.equal(isValid({ finishedAt: "2026-02-09T12:30:00Z" }), true);
    });

    test("タイムゾーンが無い値はビルド環境によって解釈が変わるのでエラーにする", () => {
      assert.equal(isValid({ finishedAt: "2026-02-09T21:30:00" }), false);
    });

    test("範囲外の時差はエラーにする", () => {
      assert.equal(isValid({ finishedAt: "2026-02-09T21:30:00+90:00" }), false);
      assert.equal(isValid({ finishedAt: "2026-02-09T21:30:00+09:60" }), false);
    });

    test("存在しない日時は繰り上げずにエラーにする", () => {
      assert.equal(isValid({ finishedAt: "2026-02-30T00:00:00+09:00" }), false);
      assert.equal(isValid({ finishedAt: "2026-02-09T24:00:00+09:00" }), false);
    });

    test("ISO 8601でない値はエラーにする", () => {
      assert.equal(isValid({ finishedAt: "xx" }), false);
    });

    test("秒を省いた値や小数秒を含む値はエラーにする（YYYY-MM-DDTHH:MM:SS±HH:MMに固定する）", () => {
      assert.equal(isValid({ finishedAt: "2026-02-09T21:30+09:00" }), false);
      assert.equal(
        isValid({ finishedAt: "2026-02-09T21:30:00.123+09:00" }),
        false,
      );
    });

    test("秒を省いたときのエラー文で，秒も必要なことが分かる", () => {
      const result = sideEventSchema.safeParse({
        ...validSideEvent,
        finishedAt: "2026-02-09T21:30+09:00",
      });
      assert.match(result.error?.issues[0]?.message ?? "", /秒/);
    });
  });

  describe("link / thumbnail", () => {
    test("https以外のURLはエラーにする", () => {
      assert.equal(isValid({ link: "http://a.example/" }), false);
      assert.equal(isValid({ thumbnail: "javascript:alert(1)" }), false);
    });

    test("空白を含むURLはエラーにする（URLの解析ではエンコードされて通ってしまう）", () => {
      assert.equal(isValid({ link: "https://a.example/ Fixes #2" }), false);
      assert.equal(isValid({ thumbnail: "https://a.example/a b.png" }), false);
    });

    test("URLは正規化する", () => {
      assert.deepEqual(
        sideEventSchema.parse({
          ...validSideEvent,
          link: "HTTPS://TypeScript-JPC.connpass.com/event/379927/",
        }),
        validSideEvent,
      );
    });
  });
});
