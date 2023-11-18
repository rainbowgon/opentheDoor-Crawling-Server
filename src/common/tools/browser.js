import puppeteer from "puppeteer";

const createBrowser = async () =>
  await puppeteer.launch({
    headless: "new", // 헤드리스 브라우저 사용(리소스 감소)
    // args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--shm-size=3gb"],
    args: [
      "--enable-features=NetworkService",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      "--shm-size=3gb", // this solves the issue
    ],
    ignoreHTTPSErrors: true,
  });

const createPage = async (browser) => {
  const page = await browser.newPage();
  await page.setRequestInterception(true); // 리소스 제한을 위해 요청 가로채기 활성화
  await page.on("request", (request) => {
    const resourceType = request.resourceType();
    if (resourceType === "image" || resourceType === "stylesheet" || resourceType === "font") {
      request.abort(); // 이미지, CSS, 폰트 등의 리소스 로딩 차단
    } else {
      request.continue();
    }
  });

  return page;
};

export { createBrowser, createPage };
