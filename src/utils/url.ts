/**
 * サイト内の絶対パスに base を付ける．
 * root 絶対パス（"/foo/"）には Astro が base を自動で付けないため，リンクは必ずこれを通す．
 */
export const withBase = (path: string): string => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};
