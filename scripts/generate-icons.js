/**
 * Script para generar iconos PNG de la PWA desde SVG
 * Ejecutar con: node scripts/generate-icons.js
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [192, 512];

async function generateIcons() {
  const inputSvg = join(__dirname, '../public/assets/icons/icon-512x512.svg');
  const outputDir = join(__dirname, '../public/assets/icons');

  for (const size of sizes) {
    const outputPath = join(outputDir, `icon-${size}x${size}.png`);
    
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Generado: icon-${size}x${size}.png`);
  }

  // También generar apple-touch-icon
  await sharp(inputSvg)
    .resize(180, 180)
    .png()
    .toFile(join(__dirname, '../public/apple-touch-icon.png'));
  
  console.log('✅ Generado: apple-touch-icon.png');

  // Favicon
  await sharp(inputSvg)
    .resize(32, 32)
    .png()
    .toFile(join(__dirname, '../public/favicon.png'));
  
  console.log('✅ Generado: favicon.png');

  console.log('\n🎉 ¡Todos los iconos generados correctamente!');
}

generateIcons().catch(console.error);
