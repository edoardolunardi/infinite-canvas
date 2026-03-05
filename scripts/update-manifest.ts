import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ARTWORKS_DIR = "./public/artworks";
const MANIFEST_PATH = "./public/artworks/manifest.json";

type ManifestItem = {
  url: string;
  type: string;
  title: string;
  artist: string;
  year: string;
  link: string;
  width: number;
  height: number;
};

async function main() {
  const files = fs.readdirSync(ARTWORKS_DIR);
  const imageFiles = files.filter(
    (f) => f.endsWith(".jpg") && f !== "manifest.json"
  );

  console.log(`Found ${imageFiles.length} image files\n`);

  const manifest: ManifestItem[] = [];

  for (const filename of imageFiles.sort()) {
    const filepath = path.join(ARTWORKS_DIR, filename);
    
    try {
      const metadata = await sharp(filepath).metadata();
      
      if (!metadata.width || !metadata.height) {
        console.error(`  Failed to get dimensions for: ${filename}`);
        continue;
      }

      // Extract a readable title from filename (remove extension and clean up)
      const baseName = filename.replace(/\.jpg$/i, "").replace(/-Enhanced-NR$/, "");
      
      const item: ManifestItem = {
        url: `/artworks/${filename}`,
        type: "image",
        title: baseName, // Placeholder - can be updated later
        artist: "Unknown Artist", // Placeholder - can be updated later
        year: "", // Placeholder - can be updated later
        link: "", // Placeholder - can be updated later
        width: metadata.width,
        height: metadata.height,
      };

      manifest.push(item);
      console.log(`  Added: ${filename} (${metadata.width}x${metadata.height})`);
    } catch (error) {
      console.error(`  Error processing ${filename}:`, error);
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\nDone! Generated manifest with ${manifest.length} entries → ${MANIFEST_PATH}`);
}

main().catch(console.error);

