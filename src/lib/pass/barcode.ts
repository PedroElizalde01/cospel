import type { BarcodeFormat } from "./schema";

export interface BarcodeFormatSpec {
  id: BarcodeFormat;
  name: string;
  apple: string;
  /** bwip-js encoder id */
  bcid: string;
  shape: "square" | "wide";
  minIOS: number;
  watch: boolean;
  /** Returns an error message when the message can't be encoded. */
  check?: (message: string) => string | null;
}

const ascii = (m: string) => (/^[\x20-\x7e]*$/.test(m) ? null : "Only basic ASCII characters can be encoded.");

export const BARCODE_SPECS: Record<BarcodeFormat, BarcodeFormatSpec> = {
  qr: { id: "qr", name: "QR Code", apple: "PKBarcodeFormatQR", bcid: "qrcode", shape: "square", minIOS: 9, watch: true },
  pdf417: { id: "pdf417", name: "PDF417", apple: "PKBarcodeFormatPDF417", bcid: "pdf417", shape: "wide", minIOS: 9, watch: true },
  aztec: { id: "aztec", name: "Aztec", apple: "PKBarcodeFormatAztec", bcid: "azteccode", shape: "square", minIOS: 9, watch: true },
  code128: { id: "code128", name: "Code 128", apple: "PKBarcodeFormatCode128", bcid: "code128", shape: "wide", minIOS: 9, watch: false, check: ascii },
  ean13: {
    id: "ean13", name: "EAN-13", apple: "PKBarcodeFormatEAN13", bcid: "ean13", shape: "wide", minIOS: 27, watch: false,
    check: (m) => (/^\d{12,13}$/.test(m) ? null : "EAN-13 needs 12 or 13 digits."),
  },
  code39: {
    id: "code39", name: "Code 39", apple: "PKBarcodeFormatCode39", bcid: "code39", shape: "wide", minIOS: 27, watch: false,
    check: (m) => (/^[0-9A-Z \-.$/+%]*$/.test(m) ? null : "Code 39 supports 0–9, A–Z, space and - . $ / + %."),
  },
  codabar: {
    id: "codabar", name: "Codabar", apple: "PKBarcodeFormatCodabar", bcid: "rationalizedCodabar", shape: "wide", minIOS: 27, watch: false,
    check: (m) => (/^[A-Da-d][0-9\-$:/.+]+[A-Da-d]$/.test(m) ? null : "Codabar needs start/stop letters A–D around digits, e.g. A12345B."),
  },
  itf: {
    id: "itf", name: "ITF", apple: "PKBarcodeFormatITF", bcid: "interleaved2of5", shape: "wide", minIOS: 27, watch: false,
    check: (m) => (/^(\d\d)+$/.test(m) ? null : "ITF needs an even number of digits."),
  },
};

export const BARCODE_PRESETS = [
  { id: "url", label: "URL", message: "https://example.com", altText: "" },
  { id: "text", label: "Text", message: "Hello from Wallet", altText: "" },
  { id: "member", label: "Member ID", message: "MBR-000123", altText: "MBR-000123" },
  { id: "coupon", label: "Coupon code", message: "SAVE20", altText: "SAVE20" },
  { id: "ticket", label: "Ticket ID", message: "TKT-8F2K-19QX", altText: "TKT-8F2K-19QX" },
] as const;

/** Escapes per the de-facto WIFI: payload spec (ZXing). */
export function wifiPayload(ssid: string, password: string, security: "WPA" | "WEP" | "nopass") {
  const esc = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
  return `WIFI:T:${security};S:${esc(ssid)};${security === "nopass" ? "" : `P:${esc(password)};`};`;
}
