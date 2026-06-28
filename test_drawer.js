import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Need to log in or use empty mode
  await page.goto('http://localhost:5173');
  
  // Wait for load
  await page.waitForSelector('.welcome-screen', { timeout: 5000 }).catch(() => {});
  
  // Click 'Explore the app (Empty state)'
  const exploreBtn = await page.$x("//button[contains(text(), 'Explore the app (Empty state)')]");
  if (exploreBtn.length > 0) {
    await exploreBtn[0].click();
  } else {
    console.log("No explore btn");
  }
  
  await page.waitForTimeout(1000);
  
  // Create a space
  await page.goto('http://localhost:5173/spaces'); // Wait, router doesn't work like this, it's SPA
  // Let's just evaluate in the browser to set up state
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('nav-spaces')); // Not how it works
  });
  
  // Let's take a screenshot of the homepage
  await page.screenshot({ path: 'home.png' });
  
  await browser.close();
})();
