import { z } from "astro/zod";
import { sideEventSchema } from "../schemas/sideEvent";
import sideEvents from "./sideEvents.json";

const result = z.array(sideEventSchema).safeParse(sideEvents);
if (!result.success) {
  throw new Error(
    `sideEvents.jsonの内容が正しくありません．\n${z.prettifyError(result.error)}`,
  );
}

export const sideEventList = result.data;
