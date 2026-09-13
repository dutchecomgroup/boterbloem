import sharp from "sharp";
import fs from "node:fs/promises";

/**
 * De merkbestanden voor de site, afgeleid uit het logo dat de klant aanleverde.
 *
 *   npx tsx scripts/maak-merkbestanden.ts
 *
 * **Bron.** `uploads/content/merk/1.png` (het logo in kleur) en `2.png` (het negatief). Allebei
 * echte PNG's met een alfakanaal, 500 × 500. Het logo dat er daarvoor stond,
 * `logo-atelier-boterbloem.png`, was in werkelijkheid een JPEG zonder transparantie: op een
 * gekleurd vlak een wit blok.
 *
 * **Waarom een script en niet met de hand geknipt.** De uitsnede van de bloemkop en de maten van
 * favicon en deel-afbeelding moeten opnieuw te maken zijn als ze een nieuw logo aanlevert.
 *
 * **Waarom `client/public/` en niet `uploads/`.** `uploads/` staat niet in git en komt niet mee in
 * de build. Merkbestanden die de site zelf nodig heeft horen in de bundel. De twee bronbestanden
 * gaan er ook heen, zodat ze niet langer op één machine staan.
 *
 * Idempotent: elke run overschrijft de afgeleiden met hetzelfde resultaat.
 */

const BRON = "uploads/content/merk";
const DOEL = "client/public/merk";
const LINNEN = { r: 247, g: 245, b: 240, alpha: 1 };
const DOORZICHTIG = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * De bloem zonder woordmerk. Gemeten op het bronbestand: de bloemkoppen lopen tot y≈230, het
 * woordmerk begint pas rond y≈385. Tot 235 pakken houdt de hele bloem en laat de letters buiten.
 */
const BLOEM_TOT = 235;

async function vierkant(buffer: Buffer): Promise<Buffer> {
  const m = await sharp(buffer).metadata();
  const zijde = Math.max(m.width!, m.height!);
  const dx = zijde - m.width!;
  const dy = zijde - m.height!;
  return sharp(buffer)
    .extend({
      top: Math.floor(dy / 2),
      bottom: Math.ceil(dy / 2),
      left: Math.floor(dx / 2),
      right: Math.ceil(dx / 2),
      background: DOORZICHTIG,
    })
    .png()
    .toBuffer();
}

async function main() {
  await fs.mkdir(DOEL, { recursive: true });

  // De bronnen zelf in de repository.
  await fs.copyFile(`${BRON}/1.png`, `${DOEL}/logo-bron.png`);
  await fs.copyFile(`${BRON}/2.png`, `${DOEL}/logo-negatief-bron.png`);
  console.log("  ✓ bronbestanden naar client/public/merk/");

  // Het volledige logo, strak bijgesneden. Het bronvlak is 500 × 500 met veel lucht; bijgesneden
  // is het 409 × 341 en valt het uit te lijnen met de tekst ernaast.
  await sharp(`${BRON}/1.png`).trim({ threshold: 1 }).png().toFile(`${DOEL}/logo.png`);
  await sharp(`${BRON}/2.png`).trim({ threshold: 1 }).png().toFile(`${DOEL}/logo-negatief.png`);
  console.log("  ✓ logo.png en logo-negatief.png, bijgesneden");

  // De bloemkop. Het hele logo in een balk van 64 px zou het woordmerk tot een paar pixels
  // terugbrengen; de bloem alleen blijft herkenbaar op 32.
  const meta = await sharp(`${BRON}/1.png`).metadata();
  // Twee losse stappen: sharp voert `trim` vóór `extract` uit, ongeacht de volgorde van de
  // aanroepen. In één keten werd het beeld eerst tot 409 px bijgesneden, en viel een uitsnede van
  // 500 px breed daarbuiten.
  const bovenstuk = await sharp(`${BRON}/1.png`)
    .extract({ left: 0, top: 0, width: meta.width!, height: BLOEM_TOT })
    .png()
    .toBuffer();
  const bloem = await sharp(bovenstuk).trim({ threshold: 1 }).png().toBuffer();
  const bloemVierkant = await vierkant(bloem);

  await sharp(bloemVierkant).resize(96, 96).png().toFile(`${DOEL}/beeldmerk.png`);
  await sharp(bloemVierkant).resize(32, 32).png().toFile("client/public/favicon-32.png");
  await sharp(bloemVierkant).resize(512, 512).png().toFile("client/public/icon-512.png");
  // iOS toont geen transparantie op het beginscherm: daar een linnen ondergrond, met marge.
  await sharp(bloemVierkant)
    .resize(150, 150)
    .extend({ top: 15, bottom: 15, left: 15, right: 15, background: LINNEN })
    .flatten({ background: LINNEN })
    .png()
    .toFile("client/public/apple-touch-icon.png");
  console.log("  ✓ beeldmerk, favicon (32), icoon (512) en apple-touch-icon (180)");

  // De deel-afbeelding voor WhatsApp en sociale media: 1200 × 630, het logo op linnen.
  const logo = await sharp(`${BRON}/1.png`).trim({ threshold: 1 }).resize({ height: 420 }).png().toBuffer();
  const lm = await sharp(logo).metadata();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: LINNEN } })
    .composite([{ input: logo, left: Math.round((1200 - lm.width!) / 2), top: Math.round((630 - lm.height!) / 2) }])
    .flatten({ background: LINNEN })
    .jpeg({ quality: 88 })
    .toFile("client/public/og-atelier-boterbloem.jpg");
  console.log("  ✓ og-atelier-boterbloem.jpg (1200 × 630)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
