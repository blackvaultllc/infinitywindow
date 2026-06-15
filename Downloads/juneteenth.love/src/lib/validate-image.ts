// Strict allowlist for user-uploaded images. Browser-side check that
// inspects MIME type AND magic bytes so an attacker can't simply rename
// an .html or .svg to .jpg and ship XSS through our storage CDN.

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

const MAGIC: Array<{ mime: string; sig: number[]; offset?: number }> = [
  { mime: "image/jpeg", sig: [0xff, 0xd8, 0xff] },
  { mime: "image/png", sig: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/gif", sig: [0x47, 0x49, 0x46, 0x38] },
  { mime: "image/webp", sig: [0x52, 0x49, 0x46, 0x46] }, // RIFF (also verify WEBP at offset 8)
];

export type ImageValidation = { ok: true; ext: string; mime: string } | { ok: false; reason: string };

export async function validateImageFile(file: File, maxBytes: number): Promise<ImageValidation> {
  if (file.size > maxBytes) return { ok: false, reason: `File must be under ${Math.round(maxBytes / 1024 / 1024)}MB.` };
  if (file.size < 8) return { ok: false, reason: "File is too small to be a valid image." };

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return { ok: false, reason: "Only JPG, PNG, WEBP, and GIF images are allowed." };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, reason: "Only JPG, PNG, WEBP, and GIF images are allowed." };
  }

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const matched = MAGIC.find((m) => m.sig.every((b, i) => head[(m.offset ?? 0) + i] === b));
  if (!matched) return { ok: false, reason: "This file is not a real image." };
  if (matched.mime === "image/webp") {
    // bytes 8..11 should be "WEBP"
    const tag = String.fromCharCode(head[8], head[9], head[10], head[11]);
    if (tag !== "WEBP") return { ok: false, reason: "This file is not a real image." };
  }
  // The detected MIME must match the file's reported MIME — block .png named as .jpg etc.
  if (matched.mime !== file.type) {
    return { ok: false, reason: "Image type does not match its contents." };
  }
  // Map detected MIME to a safe canonical extension
  const safeExt = matched.mime === "image/jpeg" ? "jpg"
    : matched.mime === "image/png" ? "png"
    : matched.mime === "image/webp" ? "webp"
    : "gif";
  return { ok: true, ext: safeExt, mime: matched.mime };
}
