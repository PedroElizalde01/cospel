import { HEX_COLOR } from "./schema";

export const isHex = (c: string) => HEX_COLOR.test(c);

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const rgbToHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/** Wallet's pass.json color syntax. */
export const toPassColor = (hex: string) => `rgb(${hexToRgb(hex).join(", ")})`;

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1–21. */
export function contrastRatio(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export const isDark = (hex: string) => luminance(hex) < 0.4;

/** Accepts "#abc", "abc", "#aabbcc", "aabbcc"; returns normalized "#aabbcc" or null. */
export function normalizeHex(input: string): string | null {
  const s = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(s)) return ("#" + s.split("").map((c) => c + c).join("")).toLowerCase();
  if (/^[0-9a-f]{6}$/i.test(s)) return ("#" + s).toLowerCase();
  return null;
}
