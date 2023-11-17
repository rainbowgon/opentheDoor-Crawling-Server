import Redis from "ioredis";
import { createBrowser } from "../../common/tools/fetch.js";
import { BID_LIST } from "../../common/config/masterkey.js";
import crawlAllTimes from "./crawler.js";
// import { createBrowser } from "../../common/tools/fetch.js";
// import crawlAllPages from "./crawler.js";
// import { BID_LIST } from "../../common/config/masterkey.js";

const PARALLEL_BATCH_SIZE = 4;

const run = async () => {
  const browser = await createBrowser();
  const redisClient = new Redis(); // Redis 클라이언트 생성

  try {
    const tasks = [];

    for (let i = 0; i < BID_LIST.length; i += PARALLEL_BATCH_SIZE) {
      const batch = BID_LIST.slice(i, i + PARALLEL_BATCH_SIZE); // 병렬처리를 위해 설정
      tasks.push(crawlAllTimes(batch, browser, collection, redisClient));
    }

    await Promise.all(tasks);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  } finally {
    await browser.close();
    redisClient.quit();
  }
};

export default run;
