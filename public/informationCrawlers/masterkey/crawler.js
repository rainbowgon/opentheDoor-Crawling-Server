import puppeteer from "puppeteer";
import { MongoClient } from "mongodb";
import Redis from "ioredis";
import crypto from "crypto";
import createIndex from "../common/elasticSearch/createIndex";

(async () => {
  console.time("Total Execution Time"); // 시간 측정 시작

  const browser = await puppeteer.launch({
    headless: true, // 헤드리스 브라우저 사용(리소스 감소)
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const uri = "mongodb://rainbow:rainbowA307@127.0.0.1:27017";
  const client = new MongoClient(uri);
  const redisClient = new Redis(); // Redis 클라이언트 생성

  try {
    await client.connect();
    const db = client.db("Escape"); // db 연결
    const collection = db.collection("room"); // collection(mysql 테이블 느낌)

    const deleteResult = await collection.deleteMany({});
    // console.log('Number of documents deleted:', deleteResult.deletedCount); 기존 데이터 삭제

    await createIndex();

    // 지점 아이디가 0~40 이였는데 이 중 데이터가 존재하는 것만 골라냄
    const successfulBids = [
      1, 2, 7, 8, 10, 11, 12, 13, 14, 16, 18, 19, 20, 21, 23, 24, 26, 27, 28, 29, 30, 31, 32, 35,
      36, 40,
    ];

    const parallelBatches = 4;
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
    await client.close();
    redisClient.quit(); // Redis 클라이언트 종료
    console.timeEnd("Total Execution Time");
  }
})();

async function crawlPages(bids, browser, collection, redisClient) {
  const page = await browser.newPage();
  const redisTasks = [];
  await page.setRequestInterception(true); // 리소스 제한을 위해 요청 가로채기 활성화
  page.on("request", (request) => {
    const resourceType = request.resourceType();
    if (resourceType === "image" || resourceType === "stylesheet" || resourceType === "font") {
      request.abort(); // 이미지, CSS, 폰트 등의 리소스 로딩 차단
    } else {
      request.continue();
    }
  });

  for (const bid of bids) {
    console.time(`Execution time for bid=${bid}`);
    await page.goto(`https://www.master-key.co.kr/booking/bk_detail?bid=${bid}`);

    const divExists = await page
      .waitForSelector("#booking_list", { visible: true, timeout: 5000 })
      .catch(() => false);

    if (divExists) {
      const data = await page.evaluate((bid) => {
        const bookingListDiv = document.getElementById("booking_list");
        const box2InnerDivs = bookingListDiv.querySelectorAll(".box2-inner");
        const results = [];
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
      }, bid);
      const hash = crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex"); // 해시 데이터 변환

      // Redis 작업을 프로미스로 래핑
      const redisTask = new Promise((resolve, reject) => {
        redisClient.get(`${bid}_hash`, async (err, previousHash) => {
          if (err) return reject(err);

          if (previousHash && previousHash === hash) {
            // console.log(`No data change detected for bid=${bid}`);
            resolve();
          } else {
            // 이 bid에 대한 데이터가 데이터베이스에 이미 있는지 확인
            const existingDataCount = await collection.countDocuments({ bid: bid });

            if (existingDataCount > 0) {
              // 데이터가 있으므로 updateMany 사용
              redisClient.set(`${bid}_hash`, hash, async (err) => {
                if (err) return reject(err);

                // 데이터 업데이트
                await collection.updateMany({ bid: bid }, { $set: data[0] }); // data가 배열이라고 가정하고 첫 번째 요소 사용
                resolve();
              });
            } else {
              // 데이터가 없으므로 insertMany 사용
              redisClient.set(`${bid}_hash`, hash, async (err) => {
                if (err) return reject(err);

                // 데이터 삽입
                await collection.insertMany(data);
                resolve();
              });
            }
          }
        });
      });

      redisTasks.push(redisTask);
      // Elasticsearch에 데이터 저장
      await indexDataToElasticsearch(data);
    } else {
      console.log(`No booking list found for bid=${bid}`);
    }

    // console.timeEnd(`Execution time for bid=${bid}`);
  }

  await page.close();
  return Promise.all(redisTasks);
}
