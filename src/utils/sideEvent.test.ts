import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import {
  formatSideEventDate,
  isSideEventClosed,
  sortSideEventsByFinishedAtDesc,
} from "./sideEvent.ts";

describe("formatSideEventDate", () => {
  test("YYYY-MM-DDを月/日と曜日に分けて返す", () => {
    assert.deepEqual(formatSideEventDate("2026-02-09"), {
      monthDay: "2/9",
      weekday: "(月)",
    });
    assert.deepEqual(formatSideEventDate("2026-05-22"), {
      monthDay: "5/22",
      weekday: "(金)",
    });
    assert.deepEqual(formatSideEventDate("2026-12-27"), {
      monthDay: "12/27",
      weekday: "(日)",
    });
  });

  describe("実行環境のタイムゾーンに依存しない", () => {
    const originalTZ = process.env.TZ;
    afterEach(() => {
      // process.envへの代入は文字列になるため，未設定だった場合は削除して戻す
      if (originalTZ === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTZ;
      }
    });

    // UTCより西と東の両方で確かめる
    for (const timeZone of ["Pacific/Honolulu", "Asia/Tokyo"]) {
      test(`${timeZone}でも曜日がずれない`, () => {
        process.env.TZ = timeZone;
        assert.deepEqual(formatSideEventDate("2026-02-09"), {
          monthDay: "2/9",
          weekday: "(月)",
        });
      });
    }
  });

  test("YYYY-MM-DD以外の形式はエラーにする", () => {
    assert.throws(() => formatSideEventDate("2026/02/09"));
    assert.throws(() => formatSideEventDate("2/9 (月)"));
  });

  test("存在しない日付はエラーにする", () => {
    assert.throws(() => formatSideEventDate("2026-02-30"));
  });
});

describe("isSideEventClosed", () => {
  const finishedAt = "2026-02-09T21:30:00+09:00";

  test("終了日時より前なら終了していない", () => {
    assert.equal(
      isSideEventClosed(finishedAt, new Date("2026-02-09T21:29:59+09:00")),
      false,
    );
  });

  test("終了日時ちょうどなら終了している", () => {
    assert.equal(
      isSideEventClosed(finishedAt, new Date("2026-02-09T21:30:00+09:00")),
      true,
    );
  });

  test("終了日時より後なら終了している", () => {
    assert.equal(
      isSideEventClosed(finishedAt, new Date("2026-02-10T00:00:00+09:00")),
      true,
    );
  });
});

describe("sortSideEventsByFinishedAtDesc", () => {
  const jan27 = { name: "1/27", finishedAt: "2026-01-27T19:30:00+09:00" };
  const feb24 = { name: "2/24", finishedAt: "2026-02-25T00:00:00+09:00" };
  const feb9 = { name: "2/9", finishedAt: "2026-02-09T21:30:00+09:00" };

  test("終了日時の新しい順に並べる", () => {
    assert.deepEqual(sortSideEventsByFinishedAtDesc([jan27, feb24, feb9]), [
      feb24,
      feb9,
      jan27,
    ]);
  });

  test("元の配列を変更しない", () => {
    const events = [jan27, feb24, feb9];
    sortSideEventsByFinishedAtDesc(events);
    assert.deepEqual(events, [jan27, feb24, feb9]);
  });
});
