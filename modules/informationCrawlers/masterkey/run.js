import { MongoClient } from "mongodb";
import createIndex from "../../common/elasticSearch/createIndex.js";
import { createBrowser } from "../../common/tools/fetch.js";
import { MONGODB_COLLECTION_NAME, MONGODB_DB_NAME, MONGODB_URL } from "../../common/config/env.js";
import crawlAllPages from "./crawler.js";
import { BID_LIST } from "../../common/config/masterkey.js";

const PARALLEL_BATCH_SIZE = 4;

const run = async () => {
  const browser = await createBrowser();
  const mongoDbClient = new MongoClient(MONGODB_URL, { useNewUrlParser: true });

  try {
    await mongoDbClient.connect();
    const db = mongoDbClient.db(MONGODB_DB_NAME); // db 연결
    const collection = db.collection(MONGODB_COLLECTION_NAME); // collection(mysql 테이블 느낌)
    await collection.deleteMany({}); // 기존 데이터 삭제

    await createIndex();

    const tasks = [];
    for (let i = 0; i < BID_LIST.length; i += PARALLEL_BATCH_SIZE) {
      const batch = BID_LIST.slice(i, i + PARALLEL_BATCH_SIZE); // 병렬처리를 위해 설정
      tasks.push(crawlAllPages(batch, browser, collection));
    }

    await Promise.all(tasks);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  } finally {
    await browser.close();
    await mongoDbClient.close();
  }
};

export default run;
