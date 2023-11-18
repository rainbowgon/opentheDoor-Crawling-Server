import Redis from "ioredis";
import { BID_LIST } from "../../common/config/masterkey.js";
import crawlAllTimes from "./crawler.js";
import { createBrowser } from "../../common/tools/browser.js";
import { REDIS_HOST, REDIS_PORT } from "../../common/config/env.js";

const PARALLEL_BATCH_SIZE = 4;

const run = async (retryCount) => {
  console.log("\n\n\n");
  console.log("retryCount:", retryCount);
  const browser = await createBrowser();
  const redisClient = new Redis({ host: REDIS_HOST, port: REDIS_PORT }); // Redis 클라이언트 생성

  try {
    await f(browser, redisClient);
    return await run(retryCount + 1);
  } catch (error) {
    console.log(error);
    return await run(retryCount + 1);
  } finally {
    await browser.close();
    redisClient.quit();
  }
};

const f = async (browser, redisClient) => {
  const tasks = [];

  for (let i = 0; i < BID_LIST.length; i += PARALLEL_BATCH_SIZE) {
    const batch = BID_LIST.slice(i, i + PARALLEL_BATCH_SIZE); // 병렬처리를 위해 설정
    tasks.push(crawlAllTimes(batch, browser, redisClient));
  }

  await Promise.all(tasks);
};

export default run;
