import { VENUE, createTargetUrl } from "../../common/config/masterkey.js";
import { createInsertDataTask } from "../../common/redis/redisTaskCreator.js";
import { createPage } from "../../common/tools/fetch.js";

const crawlAllTimes = async (bids, browser, redisClient) => {
  const page = await createPage(browser);
  const tasks = [];

  for (const bid of bids) {
    const task = await crawlSinglePage(page, bid, redisClient);
    tasks.push(task);
    break;
  }

  await page.close();
  return Promise.all(tasks);
};

const crawlSinglePage = async (page, bid, redisClient) => {
  await page.goto(createTargetUrl(bid));

  const isDivExists = await page
    .waitForSelector("#booking_list", { visible: true, timeout: 5000 })
    .catch(() => false);

  if (!isDivExists) {
    return;
  }

  const results = await crawlCurrentPage(page);
  const task = createInsertDataTask(VENUE, bid, results, redisClient); // Redis 작업을 프로미스로 래핑
  return task;
};

const crawlCurrentPage = async (page) =>
  page.evaluate(() => {
    const results = [];

    const bookingListDiv = document.getElementById("booking_list");
    const box2InnerDivs = bookingListDiv.querySelectorAll(".box2-inner");

    box2InnerDivs.forEach((div) => {
      const themeTitle = div.querySelector(".left.room_explanation_go .title")?.innerText || "";
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
        themeTitle,
        timePossibleList,
      });
    });
    return results;
  });

export default crawlAllTimes;
