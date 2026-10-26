export type ImageKind = { mime: "image/jpeg" | "image/png" | "image/webp"; ext: "jpg" | "png" | "webp" };

/** Identifies an image by its first bytes (never trusts the file name or the declared type). */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((b, i) => bytes[i] === b)) {
    return { mime: "image/png", ext: "png" };
  }
  const ascii = (from: number, text: string) =>
    bytes.length >= from + text.length && [...text].every((c, i) => bytes[from + i] === c.charCodeAt(0));
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return { mime: "image/webp", ext: "webp" };
  return null;
}

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
