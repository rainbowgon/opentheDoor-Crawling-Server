import { TARGET_URL, VENUE } from "../../common/config/masterkey.js";
import esInsertData from "../../common/elasticSearch/insertData.js";
import createTask from "../../common/tools/createInsertTask.js";
import { createPage } from "../../common/tools/fetch.js";

const crawlAllPages = async (bids, browser, collection, redisClient) => {
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
  await page.goto(`${TARGET_URL}?bid=${bid}`);

  const isDivExists = await page
    .waitForSelector("#booking_list", { visible: true, timeout: 5000 })
    .catch(() => false);

  if (!isDivExists) {
    return;
  }

  const data = await crawlCurrentPage(page);
  await esInsertData(data);
  const task = createTask(VENUE, bid, data, collection, redisClient); // Redis 작업을 프로미스로 래핑
  return task;
};

const crawlCurrentPage = async (page) =>
  page.evaluate(() => {
    const results = [];

    const bookingListDiv = document.getElementById("booking_list");
    const box2InnerDivs = bookingListDiv.querySelectorAll(".box2-inner");
    const venue = document.querySelector(".theme-title")?.innerText || "";
    // 크롤링 해오는 부분
    box2InnerDivs.forEach((div) => {
      const title = div.querySelector(".left.room_explanation_go .title")?.innerText || "";
      const explanation = div.querySelector(".left.room_explanation_go")?.dataset.text || "";
      const img = div.querySelector("img")?.src || "";
      const genre = div.querySelector(".right .info .hashtags")?.innerText || "";
      const genreArray = genre.split(" ").map((tag) => tag.replace(/#/g, "").trim()); // Split the text by '#' and trim each item
      const spanTags = div.querySelector(".right .info").querySelectorAll("span");
      const levelText = spanTags[0]?.innerText || "";
      const keySymbol = "🔑"; // Define the key symbol
      const level = levelText.split(keySymbol).length - 1; // Count the occurrences of the key symbol
      const headcount = spanTags[1]?.innerText.match(/(\d~\d명)/)?.[1] || "".split("~");
      const minHeadcount = parseInt(headcount[0], 10);
      const maxHeadcount = parseInt(headcount[2], 10);
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
        venue,
        title,
        explanation,
        img,
        genre: genreArray,
        level,
        minHeadcount,
        maxHeadcount,
        timePossibleList,
      });
    });
    return results;
  });

export default crawlAllPages;
