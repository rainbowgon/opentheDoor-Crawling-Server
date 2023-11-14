import { createTargetUrl } from "../../common/config/masterkey.js";
import esInsertData from "../../common/elasticSearch/insertData.js";
import mongodbInsertData from "../../common/mongodb/mongodbInsertData.js";
import { createPage } from "../../common/tools/fetch.js";
import geocodeAddress from "../../common/tools/geocoding.js";
import uploadImageToS3 from "../../common/tools/imageUploader.js";

const crawlAllPages = async (bids, browser, collection) => {
  const page = await createPage(browser);
  const tasks = [];

  for (const bid of bids) {
    const task = await crawlSinglePage(page, bid, collection);
    tasks.push(task);
  }

  await page.close();
  return Promise.all(tasks);
};

const crawlSinglePage = async (page, bid, collection) => {
  const url = createTargetUrl(bid);
  await page.goto(url);

  const isDivExists = await page
    .waitForSelector("#booking_list", { visible: true, timeout: 5000 })
    .catch(() => false);

  if (!isDivExists) {
    return;
  }

  const data = await crawlCurrentPage(page);

  await esInsertData(data,url);
  await mongodbInsertData(bid, data, collection, url);

  return data;
};

const crawlCurrentPage = async (page) => {
  const tab1Results = await page.evaluate(() => {
    const results = [];

    const bookingListDiv = document.getElementById("booking_list");
    const box2InnerDivs = bookingListDiv.querySelectorAll(".box2-inner");
    const venue = document.querySelector(".theme-title")?.innerText || "";
    // 크롤링 해오는 부분
    box2InnerDivs.forEach((div) => {
      const title =
        div.querySelector(".left.room_explanation_go .title")?.innerText || "";
      const explanation =
        div.querySelector(".left.room_explanation_go")?.dataset.text || "";
      const poster = div.querySelector("img")?.src || "";
      const genre =
        div.querySelector(".right .info .hashtags")?.innerText || "";
      const genreArray = genre
        .split(" ")
        .map((tag) => tag.replace(/#/g, "").trim()); // Split the text by '#' and trim each item
      const spanTags = div
        .querySelector(".right .info")
        .querySelectorAll("span");
      const levelText = spanTags[0]?.innerText || "";
      const keySymbol = "🔑"; // Define the key symbol
      const level = levelText.split(keySymbol).length - 1; // Count the occurrences of the key symbol
      const headcountText = spanTags[1]?.innerText;
      const headcountMatch = headcountText.match(/(\d+)~(\d+)(인)?명/);

      let minHeadcount = 1; // 기본값으로 0 설정
      let maxHeadcount = 10; // 기본값으로 10 설정

      if (headcountMatch && headcountMatch[1] && headcountMatch[2]) {
        const parsedMin = parseInt(headcountMatch[1], 10);
        const parsedMax = parseInt(headcountMatch[2], 10);

        if (!isNaN(parsedMin) && !isNaN(parsedMax)) {
          // parsedMin과 parsedMax의 값으로 minHeadcount와 maxHeadcount 업데이트
          minHeadcount = parsedMin;
          maxHeadcount = parsedMax;
        }
      }

      results.push({
        venue,
        title,
        explanation,
        poster,
        genre: genreArray,
        level,
        minHeadcount,
        maxHeadcount,
      });
    });

    return results;
  });

  // // tab1Results를 순회하면서 이미지를 업로드하고 URL을 업데이트합니다.
  // for (const result of tab1Results) {
  //   if (result.poster) {
  //     // 이미지를 S3에 업로드하는 로직을 추가합니다.
  //     // AWS SDK는 Node.js 환경에서 사용 가능합니다.
  //     const uploadedImageUrl = await uploadImageToS3(
  //       result.poster,
  //       result.title
  //     );
  //     result.poster = uploadedImageUrl;
  //   }
  // }

  // tab2를 클릭하기 전에, evaluate를 빠져나와야 합니다.
  await page.click("#tab2"); // tab2를 클릭합니다.

  await Promise.race([
    page.waitForFunction(
      () =>
        document
          .querySelector('a[href="#tab1"]')
          .classList.contains("active") ||
        document
          .querySelector("div#tab2.tab-content")
          .classList.contains("active")
    ),
    page.waitForTimeout(3000), // 최대 3000ms까지 기다립니다.
  ]);
  // tab2의 데이터를 수집
  const tab2Results = await page.evaluate(() => {
    const results = {
      left: [],
      right: [],
      box3InnerHTML: "",
      venueToS: "",
      latitude: "",
      longitude: "",
    };

    const box3Inner = document.querySelector(".box3-inner");

    if (box3Inner) {
      const leftTexts = Array.from(box3Inner.querySelectorAll(".left"))
        .map((el) => el.innerText.trim())
        .join(" ");
      const rightTexts = Array.from(box3Inner.querySelectorAll(".right"))
        .map((el) => el.innerText.trim())
        .join(" ");
      results.venueToS = leftTexts + " " + rightTexts;
    }

    const box3Inner3 = document.querySelector(".box3-inner3");
    if (box3Inner3) {
      const contactInfoText = box3Inner3.innerText.trim();

      // 연락처 정보를 찾아서 results.tel에 할당합니다.
      const phoneLink = document.querySelector('p > a[href^="tel:"]');
      if (phoneLink) {
        results.tel = phoneLink.innerText.trim();
      }

      // 주소 정보를 찾아서 results.location에 할당합니다.
      const addressMatch = contactInfoText.match(/주소 : (.+)/);
      if (addressMatch && addressMatch[1]) {
        results.location = addressMatch[1];
      }
    }
    return results;
  });

  if (tab2Results.location) {
    // location 값이 있을 때만 지오코딩을 실행합니다.
    const geocodeResult = await geocodeAddress(tab2Results.location);
    if (geocodeResult) {
      tab2Results.latitude = geocodeResult.latitude;
      tab2Results.longitude = geocodeResult.longitude;
    }
  }

  const combinedResults = tab1Results.map((item) => ({
    ...item,
    tel: tab2Results.tel,
    location: tab2Results.location,
    venueToS: tab2Results.venueToS,
    latitude: tab2Results.latitude,
    longitude: tab2Results.longitude,
  }));

  return combinedResults;
};

export default crawlAllPages;
