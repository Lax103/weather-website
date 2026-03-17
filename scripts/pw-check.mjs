import { chromium } from '@playwright/test';

async function main() {
  const url = process.argv[2] ?? 'http://localhost:5173/';

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // Reduce flakiness
  page.setDefaultTimeout(30_000);

  await page.goto(url, { waitUntil: 'networkidle' });
  // Let animations run
  await page.waitForTimeout(2000);

  // Grab computed animation info
  const animInfo = await page.evaluate(() => {
    const overlay = document.querySelector('.overlay');
    const bg = document.querySelector('.bg');
    const scene = document.querySelector('canvas.scene');
    const app = document.querySelector('.app');

    const overlayStyle = overlay ? getComputedStyle(overlay) : null;

    return {
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      condition: app?.getAttribute('data-condition'),
      overlay: overlay
        ? {
            opacity: overlayStyle?.opacity,
            animationName: overlayStyle?.animationName,
            animationDuration: overlayStyle?.animationDuration,
            backgroundImage: overlayStyle?.backgroundImage?.slice(0, 120) ?? null,
          }
        : null,
      bgPresent: !!bg,
      canvasPresent: !!scene,
    };
  });

  console.log('ANIM_DEBUG', JSON.stringify(animInfo, null, 2));

  await page.screenshot({ path: 'artifacts/localhost.png', fullPage: true });

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
