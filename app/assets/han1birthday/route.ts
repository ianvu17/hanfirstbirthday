import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const photoPath = path.join(
    process.cwd(),
    "lib",
    "assets",
    "han1birthday.JPEG",
  );
  const photo = await readFile(photoPath);

  return new Response(new Uint8Array(photo), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(photo.byteLength),
      "Content-Type": "image/jpeg",
    },
  });
}
