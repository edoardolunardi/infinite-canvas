import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ARTWORKS_DIR = "./public/artworks";
const MANIFEST_PATH = "./public/artworks/manifest.json";
const MAX_DIMENSION = 1000; // Max width or height
const JPEG_QUALITY = 100; // Maximum quality

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

async function optimizeImage(filepath: string): Promise<{ width: number; height: number; originalSize: number; newSize: number } | null> {
  try {
    const stats = fs.statSync(filepath);
    const originalSize = stats.size;
    
    // Get current image metadata
    const metadata = await sharp(filepath).metadata();
    
    if (!metadata.width || !metadata.height) {
      console.error(`  Failed to get dimensions for: ${path.basename(filepath)}`);
      return null;
    }

    const { width, height } = metadata;
    
    // Calculate new dimensions while maintaining aspect ratio
    // Scale down if either dimension exceeds MAX_DIMENSION
    let newWidth = width;
    let newHeight = height;
    
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const aspectRatio = width / height;
      
      if (width > height) {
        // Landscape or square - scale by width
        newWidth = Math.min(width, MAX_DIMENSION);
        newHeight = Math.round(newWidth / aspectRatio);
      } else {
        // Portrait - scale by height
        newHeight = Math.min(height, MAX_DIMENSION);
        newWidth = Math.round(newHeight * aspectRatio);
      }
    }

    // Always process to ensure all images meet the max dimension requirement
    const needsResize = newWidth !== width || newHeight !== height;

    // Create a temporary file for the optimized image
    const tempPath = `${filepath}.tmp`;
    
    await sharp(filepath)
      .resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ 
        quality: JPEG_QUALITY,
        mozjpeg: true, // Better compression
      })
      .toFile(tempPath);

    const newStats = fs.statSync(tempPath);
    const newSize = newStats.size;
    
    // Replace original with optimized version
    fs.renameSync(tempPath, filepath);
    
    return {
      width: newWidth,
      height: newHeight,
      originalSize,
      newSize,
    };
  } catch (error) {
    console.error(`  Error optimizing ${path.basename(filepath)}:`, error);
    return null;
  }
}

async function main() {
  // Read existing manifest to preserve metadata
  let existingManifest: ManifestItem[] = [];
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      existingManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    } catch (error) {
      console.error('Failed to read existing manifest:', error);
    }
  }

  // Create a map of existing manifest entries by filename
  const manifestMap = new Map<string, ManifestItem>();
  for (const item of existingManifest) {
    const filename = item.url.replace('/artworks/', '');
    manifestMap.set(filename, item);
  }

  const files = fs.readdirSync(ARTWORKS_DIR);
  const imageFiles = files.filter(
    (f) => f.endsWith(".jpg") && f !== "manifest.json"
  );

  console.log(`Found ${imageFiles.length} image files to optimize\n`);
  console.log(`Target: Max dimension ${MAX_DIMENSION}px @ ${JPEG_QUALITY}% quality\n`);

  const manifest: ManifestItem[] = [];
  let totalOriginalSize = 0;
  let totalNewSize = 0;
  let processedCount = 0;

  for (let i = 0; i < imageFiles.length; i++) {
    const filename = imageFiles[i];
    const filepath = path.join(ARTWORKS_DIR, filename);
    
    console.log(`[${i + 1}/${imageFiles.length}] Processing: ${filename}`);
    
    const result = await optimizeImage(filepath);
    
    if (result) {
      totalOriginalSize += result.originalSize;
      totalNewSize += result.newSize;
      processedCount++;
      
      const reduction = ((1 - result.newSize / result.originalSize) * 100).toFixed(1);
      const sizeMB = (result.newSize / (1024 * 1024)).toFixed(2);
      console.log(`  ✓ ${result.width}x${result.height} - ${sizeMB}MB (${reduction}% reduction)`);
      
      // Get existing manifest entry or create new one
      const existing = manifestMap.get(filename);
      const baseName = filename.replace(/\.jpg$/i, "").replace(/-Enhanced-NR$/, "");
      
      const item: ManifestItem = {
        url: `/artworks/${filename}`,
        type: "image",
        title: existing?.title || baseName,
        artist: existing?.artist || "Unknown Artist",
        year: existing?.year || "",
        link: existing?.link || "",
        width: result.width,
        height: result.height,
      };
      
      manifest.push(item);
    }
  }

  // Write updated manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  
  const totalReduction = ((1 - totalNewSize / totalOriginalSize) * 100).toFixed(1);
  const totalOriginalMB = (totalOriginalSize / (1024 * 1024)).toFixed(2);
  const totalNewMB = (totalNewSize / (1024 * 1024)).toFixed(2);
  
  console.log(`\n✅ Done!`);
  console.log(`   Processed: ${processedCount} images`);
  console.log(`   Original size: ${totalOriginalMB} MB`);
  console.log(`   New size: ${totalNewMB} MB`);
  console.log(`   Total reduction: ${totalReduction}%`);
  console.log(`   Updated manifest: ${MANIFEST_PATH}`);
}

main().catch(console.error);

