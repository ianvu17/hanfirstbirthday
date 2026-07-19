import { mkdir, writeFile } from "node:fs/promises";

import sharp from "sharp";

import { createSupabaseServiceClient } from "@/lib/supabase/server";

const requestedOutputPath = process.env.STORED_AVATAR_OUTPUT;

async function main() {
  const supabase = createSupabaseServiceClient();
  const participantResult = await supabase
    .from("participants")
    .select("avatar_path")
    .eq("avatar_type", "photo")
    .not("avatar_path", "is", null)
    .order("avatar_updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (participantResult.error) throw participantResult.error;
  if (!participantResult.data?.avatar_path) {
    throw new Error("No stored photo avatar is available for inspection.");
  }

  const download = await supabase.storage
    .from("party-avatars")
    .download(participantResult.data.avatar_path);
  if (download.error) throw download.error;

  const bytes = Buffer.from(await download.data.arrayBuffer());
  const metadata = await sharp(bytes).metadata();
  if (metadata.width !== 512 || metadata.height !== 512) {
    throw new Error(`Stored avatar is ${metadata.width ?? "?"}x${metadata.height ?? "?"}, expected 512x512.`);
  }

  const outputPath =
    requestedOutputPath ??
    `tmp/stored-avatar-inspection.${metadata.format === "jpeg" ? "jpg" : metadata.format ?? "img"}`;
  await mkdir("tmp", { recursive: true });
  await writeFile(outputPath, bytes);
  console.log(`Stored avatar decoded successfully: ${metadata.width}x${metadata.height} ${metadata.format ?? "unknown"}.`);
  console.log(`Private inspection copy: ${outputPath}`);
}

void main();
