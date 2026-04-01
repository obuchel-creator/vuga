// Automated image optimization script for assets folder
// Requires: npm install sharp

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assetDir = path.join(__dirname, 'assets');
const maxIconSize = 512;
const maxSplashSize = 1200;

const optimizeImage = async (file, maxSize) => {
  const ext = path.extname(file).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return;
  const filePath = path.join(assetDir, file);
  const outputPath = path.join(assetDir, 'optimized_' + file);
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();
    const width = Math.min(metadata.width, maxSize);
    const height = Math.min(metadata.height, maxSize);
    await image.resize(width, height).toFile(outputPath);
    fs.renameSync(outputPath, filePath);
    console.log(`Optimized: ${file}`);
  } catch (err) {
    console.error(`Error optimizing ${file}:`, err.message);
  }
};

fs.readdirSync(assetDir).forEach(file => {
  if (file.includes('logo') || file.includes('icon') || file.includes('favicon')) {
    optimizeImage(file, maxIconSize);
  } else if (file.includes('splash')) {
    optimizeImage(file, maxSplashSize);
  } else if (file.includes('low') || file.includes('medium') || file.includes('high')) {
    optimizeImage(file, maxIconSize);
  }
});

console.log('Image optimization complete.');
