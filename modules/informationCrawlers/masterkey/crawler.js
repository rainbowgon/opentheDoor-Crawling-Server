import crypto from "crypto";
import insertData from "../../common/elasticSearch/insertData.js";
import { createPage } from "../../common/tools/fetch.js";

const TARGET_URL = "https://www.master-key.co.kr/booking/bk_detail";

const crawlAllPages = async (bids, browser, collection, redisClient) => {
  const page = await createPage(browser);
  const redisTasks = [];

  for (const bid of bids) {
    const redisTask = await crawlSinglePage(page, bid, collection, redisClient);
    redisTasks.push(redisTask);
  }

  await page.close();
  return Promise.all(redisTasks);
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
  await insertData(data);
  const hash = crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex"); // 해시 데이터 변환
  const redisTask = createRedisTask(bid, data, hash, collection, redisClient); // Redis 작업을 프로미스로 래핑
  return redisTask;
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

const createRedisTask = (bid, data, hash, collection, redisClient) =>
  new Promise((resolve, reject) => {
    const HASH_KEY = `${bid}_hash`;
    redisClient.get(HASH_KEY, async (error, previousHash) => {
      if (error) return reject(error);

      if (previousHash && previousHash === hash) {
        // console.log(`No data change detected for bid=${bid}`);
        resolve();
        return;
      }

      // 이 bid에 대한 데이터가 데이터베이스에 이미 있는지 확인
      const existingDataCount = await collection.countDocuments({ bid: bid });

      redisClient.set(HASH_KEY, hash, async (error) => {
        if (error) return reject(error);

        if (isDataExist(existingDataCount)) {
          await collection.updateMany({ bid: bid }, { $set: data[0] }); // data가 배열이라고 가정하고 첫 번째 요소 사용
        } else {
          await collection.insertMany(data);
        }

        resolve();
      });
    });
  });

const isDataExist = (existingDataCount) => existingDataCount > 0;

export default crawlAllPages;
