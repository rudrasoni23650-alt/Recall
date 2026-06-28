import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('response', response => {
      if (!response.ok()) {
        console.log('BROWSER ERROR:', response.status(), response.url());
      }
    });
    
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await browser.close();
  } catch (err) {
    console.error('Script error:', err);
  }
})();
