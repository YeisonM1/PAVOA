import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'dist', 'brand');
const markPath = path.join(rootDir, 'public', 'pavoa-mark.png');
const htmlPath = path.join(outputDir, 'patron-pavoa-blanco.html');

const markSrc = `file:///${markPath.replaceAll('\\', '/')}`;

const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Patron PAVOA</title>
    <style>
      @page {
        size: A4;
        margin: 0;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        width: 210mm;
        height: 297mm;
        margin: 0;
        background: #0b0b0b;
      }

      body {
        display: grid;
        place-items: center;
        font-family: Arial, sans-serif;
      }

      .page {
        position: relative;
        width: 210mm;
        height: 297mm;
        overflow: hidden;
        background:
          radial-gradient(circle at 50% 8%, rgba(255, 255, 255, 0.08), transparent 32%),
          linear-gradient(135deg, #151515 0%, #080808 100%);
      }

      .pattern {
        position: absolute;
        inset: 8mm 8mm 18mm;
        display: grid;
        grid-template-columns: repeat(11, 1fr);
        grid-auto-rows: 17.5mm;
        align-items: center;
        justify-items: center;
        gap: 2mm 3mm;
      }

      .mark {
        width: 11mm;
        height: auto;
        opacity: 0.82;
        filter: brightness(0) invert(1);
      }

      .mark:nth-child(3n) {
        opacity: 0.68;
      }

      .mark:nth-child(5n) {
        transform: translateY(1.2mm);
      }

      .mark:nth-child(7n) {
        transform: translateY(-1mm);
      }

      .border {
        position: absolute;
        inset: 5mm;
        border: 0.35mm solid rgba(255, 255, 255, 0.34);
        pointer-events: none;
      }

      .brand {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 8mm;
        text-align: center;
        color: rgba(255, 255, 255, 0.66);
        font-size: 7pt;
        letter-spacing: 0.42em;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="pattern" aria-hidden="true">
        ${Array.from({ length: 143 }, () => `<img class="mark" src="${markSrc}" alt="" />`).join('\n        ')}
      </section>
      <div class="border"></div>
      <div class="brand">PAVOA</div>
    </main>
  </body>
</html>`;

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(htmlPath, html, 'utf8');

console.log(`HTML base: ${htmlPath}`);
console.log('Para generar el PDF: npx playwright pdf --wait-for-timeout=1000 "' + htmlPath + '" "' + path.join(outputDir, 'patron-pavoa-blanco.pdf') + '"');
