import { VENUE, createTargetUrl } from "../../common/config/masterkey";
import { createPage } from "../../common/tools/fetch";

const crawlAllTimes = async (bids, browser, collection, redisClient) => {
  const page = await createPage(browser);
  const tasks = [];

  for (const bid of bids) {
    const task = await crawlSinglePage(page, bid, collection, redisClient);
    tasks.push(task);
  }

  await page.close();
  return Promise.all(tasks);
};

const crawlSinglePage = async (page, bid, collection, redisClient) => {
  await page.goto(createTargetUrl(bid));

  const isDivExists = await page
    .waitForSelector("#booking_list", { visible: true, timeout: 5000 })
    .catch(() => false);

  if (!isDivExists) {
    return;
  }

  const data = await crawlCurrentPage(page);
  await esInsertData(data);
  const task = createInsertTask(VENUE, bid, data, collection, redisClient); // Redis 작업을 프로미스로 래핑
  return task;
};

const crawlCurrentPage = async (page) =>
  page.evaluate(() => {
    const results = [];

    const bookingListDiv = document.getElementById("booking_list");
    const box2InnerDivs = bookingListDiv.querySelectorAll(".box2-inner");

    // 크롤링 해오는 부분
    box2InnerDivs.forEach((div) => {
      const pTags = div.querySelectorAll("p");
      const timePossibleList = [];
      pTags.forEach((pTag) => {
        const aTag = pTag.querySelector("a");
        const timeMatch = aTag?.textContent.match(/(\d{2}:\d{2})/);
        const time = timeMatch ? timeMatch[1] : "";
        const possible = aTag?.querySelector("span")?.textContent || "";
        timePossibleList.push({ time, possible });
      });

      results.push({
        timePossibleList,
      });
    });
    return results;
  });

export default crawlAllTimes;
