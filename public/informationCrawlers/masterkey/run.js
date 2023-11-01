import { MongoClient } from "mongodb";
import Redis from "ioredis";
import createIndex from "../../common/elasticSearch/createIndex";
import createBrowser from "../../common/tools/fetch";
import { MONGODB_URL } from "../../common/tools/config";

const browser = await createBrowser();

// 지점 아이디가 0~40 이였는데 이 중 데이터가 존재하는 것만 골라냄
const successfulBids = [
  1, 2, 7, 8, 10, 11, 12, 13, 14, 16, 18, 19, 20, 21, 23, 24, 26, 27, 28, 29, 30, 31, 32, 35, 36,
  40,
];

const parallelBatches = 4;

const run = async () => {
  const mongoDbClient = new MongoClient(MONGODB_URL);
  const redisClient = new Redis(); // Redis 클라이언트 생성

  try {
    await mongoDbClient.connect();
    const db = mongoDbClient.db("Escape"); // db 연결
    const collection = db.collection("room"); // collection(mysql 테이블 느낌)
    await collection.deleteMany({}); // 기존 데이터 삭제

    await createIndex();

    const tasks = [];
    for (let i = 0; i < successfulBids.length; i += parallelBatches) {
      const batch = successfulBids.slice(i, i + parallelBatches); // 병렬처리를 위해 설정
      tasks.push(crawlPages(batch, browser, collection, redisClient));
    }

    await Promise.all(tasks);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await browser.close();
    await mongoDbClient.close();
    redisClient.quit();
  }
};

export default run;
