const { chromium } = require('playwright');
const fs = require('fs');

async function run() {
  const logFile = 'C:\\Users\\acer\\.gemini\\antigravity-ide\\brain\\017daeb9-00d7-4c2e-a9dc-9d84b38cca08\\scratch\\test-tabs.log';
  const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
  };

  if (fs.existsSync(logFile)) {
    fs.unlinkSync(logFile);
  }

  log('Starting browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Log console messages
  page.on('console', msg => {
    log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    log(`[PAGE ERROR] ${err.message}`);
  });

  // Log page navigation/URL changes
  page.on('framenavigated', frame => {
    log(`[NAVIGATED] ${frame.url()}`);
  });

  try {
    log('Navigating to login page...');
    await page.goto('http://localhost:3000/login');

    log('Filling login form...');
    await page.fill('input[type="tel"]', '99');
    await page.fill('input[type="password"]', '00');
    
    log('Submitting login form...');
    await page.click('button[type="submit"]');

    log('Waiting for redirection to dashboard...');
    await page.waitForURL('**/muzakki-dashboard**', { timeout: 10000 });
    log(`Redirected! Current URL: ${page.url()}`);

    // Wait for page load
    await page.waitForTimeout(3000);
    log(`After 3s load. Current URL: ${page.url()}`);

    // Click Riwayat & BSZ
    log('Clicking "Riwayat & BSZ" in sidebar...');
    await page.click('text="Riwayat & BSZ"');
    
    log('Clicked! Waiting 3 seconds to see if it redirects...');
    await page.waitForTimeout(3000);
    log(`Current URL after click: ${page.url()}`);

    // Click Pengaturan
    log('Clicking "Pengaturan" in sidebar...');
    await page.click('text="Pengaturan"');
    
    log('Clicked! Waiting 3 seconds to see if it redirects...');
    await page.waitForTimeout(3000);
    log(`Current URL after click: ${page.url()}`);

  } catch (error) {
    log(`[ERROR] ${error.message}`);
  } finally {
    await browser.close();
    log('Browser closed.');
  }
}

run();
