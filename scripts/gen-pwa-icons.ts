import sharp from 'sharp'
import { mkdirSync } from 'fs'

const SRC = 'public/smo-icon.png'
const OUT_DIR = 'public/icons'
mkdirSync(OUT_DIR, { recursive: true })

const sizes = [192, 512]

async function main() {
  for (const size of sizes) {
    await sharp(SRC)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(`${OUT_DIR}/icon-${size}.png`)
    console.log('generated', `icon-${size}.png`)
  }
  // Maskable icon: same image with padding so the safe zone (~80%) keeps the
  // logo inside the masked circle on Android.
  for (const size of [192, 512]) {
    await sharp(SRC)
      .resize({
        width: Math.round(size * 0.8),
        height: Math.round(size * 0.8),
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .extend({
        top: Math.round(size * 0.1),
        bottom: Math.round(size * 0.1),
        left: Math.round(size * 0.1),
        right: Math.round(size * 0.1),
        background: { r: 16, g: 118, b: 110, alpha: 1 }, // emerald-700 #0f766e
      })
      .png()
      .toFile(`${OUT_DIR}/maskable-${size}.png`)
    console.log('generated', `maskable-${size}.png`)
  }
  // Apple touch icon (180×180)
  await sharp(SRC)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(`${OUT_DIR}/apple-touch-icon.png`)
  console.log('generated', 'apple-touch-icon.png')
  // Favicon 32×32 + 16×16
  for (const s of [16, 32]) {
    await sharp(SRC).resize(s, s, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toFile(`${OUT_DIR}/favicon-${s}.png`)
  }
  console.log('done')
}

main().catch((e) => { console.error(e); process.exit(1) })
