import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_URL = 'http://localhost:8080/category/saju';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // 1. 인생 총운 탭 (기본)
  console.log('1/4 인생 총운 탭 로딩...');
  await page.goto(TARGET_URL + '?tab=lifetime');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(__dirname, 'screenshot_lifetime.png'), fullPage: true });
  console.log('📸 인생 총운 탭 스크린샷 저장 완료');

  // 2. 신년 운세 탭
  console.log('2/4 신년 운세 탭 로딩...');
  await page.goto(TARGET_URL + '?tab=new-year');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(__dirname, 'screenshot_newyear.png'), fullPage: true });
  console.log('📸 신년 운세 탭 스크린샷 저장 완료');

  // 3. 오늘의 나 탭
  console.log('3/4 오늘의 나 탭 로딩...');
  await page.goto(TARGET_URL + '?tab=today');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(__dirname, 'screenshot_today.png'), fullPage: true });
  console.log('📸 오늘의 나 탭 스크린샷 저장 완료');

  // 4. 인생 총운 탭 하단까지 스크롤 (브릿지 배너 확인)
  console.log('4/4 인생 총운 하단 브릿지 배너 확인...');
  await page.goto(TARGET_URL + '?tab=lifetime');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(__dirname, 'screenshot_bridge.png'), fullPage: true });
  console.log('📸 브릿지 배너 스크린샷 저장 완료');

  await browser.close();
  console.log('✅ 모든 검증 스크린샷 캡쳐 완료!');
})();
