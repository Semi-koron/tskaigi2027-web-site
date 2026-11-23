import { z } from "astro/zod";
// scriptsからNodeで直接読み込むため，拡張子まで書く
import { formatSideEventDate } from "../utils/sideEvent.ts";

const DATE_ERROR = "存在する日付をYYYY-MM-DD形式で指定してください";

/**
 * 表示用の日付処理（formatSideEventDate）で扱える日付か．
 * Date.UTCは0〜99年を1900年代として扱うため，z.iso.dateが通す0〜99年をここで弾く
 */
const canFormatDate = (date: string): boolean => {
  try {
    formatSideEventDate(date);
    return true;
  } catch {
    return false;
  }
};

/**
 * httpsのURL．
 * URLの解析は空白をエンコードして通してしまうため，空白を含む値は先に弾く．
 * httpの画像はhttpsのサイトで混在コンテンツになるため，httpsだけを受け付ける．
 */
const httpsUrlSchema = z
  .string()
  .regex(/^\S+$/, { error: "空白を含まないhttpsのURLを指定してください" })
  .pipe(
    z.url({
      protocol: /^https$/,
      normalize: true,
      error: "httpsのURLを指定してください",
    }),
  );

export const sideEventSchema = z.object({
  /** 開催日（YYYY-MM-DD） */
  date: z.iso
    .date({ error: DATE_ERROR, abort: true })
    .refine(canFormatDate, { error: DATE_ERROR }),
  /** イベント名 */
  name: z.string().min(1),
  /** イベントページのURL */
  link: httpsUrlSchema,
  /** サムネイル画像のURL */
  thumbnail: httpsUrlSchema,
  /** イベントの詳細 */
  detail: z.string(),
  /** タグ */
  tags: z.array(z.string().min(1)).optional(),
  /** 主催 */
  sponsors: z.array(z.string().min(1)).min(1),
  /** 終了日時 */
  finishedAt: z.iso.datetime({
    offset: true,
    precision: 0,
    error:
      "YYYY-MM-DDTHH:MM:SS+09:00の形式（秒とタイムゾーンを含める）で指定してください（例: 2026-02-09T21:30:00+09:00）",
  }),
});

export type SideEvent = z.infer<typeof sideEventSchema>;
