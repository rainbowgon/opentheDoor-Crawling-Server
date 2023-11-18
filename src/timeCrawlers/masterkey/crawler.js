import { VENUE, createTargetUrl } from "../../common/config/masterkey.js";
import { createInsertDataTask } from "../../common/redis/redisTaskCreator.js";
import { createPage } from "../../common/tools/browser.js";
import { Time, TimeLine, TimeSlot } from "../../common/tools/class.js";
import AvailableStatus from "../../common/tools/enum.js";
import * as cheerio from "cheerio";

const crawlAllTimes = async (bids, browser, redisClient) => {
  const tasks = [];

  for (const bid of bids) {
    const page = await createPage(browser);
    console.log("bid:", bid);
    try {
      await Promise.all([
        page.waitForNavigation(),
        page.goto(createTargetUrl(bid)),
        page.waitForSelector("#tab1 > div.box1 > div > div.date-click > div"),
      ]);

      const timeLines = await crawlCurrentPage(page);
      for (const timeLine of timeLines) {
        tasks.push(createInsertDataTask(timeLine, redisClient));
      }
    } catch (error) {
      console.log("error");
      console.log("bid:", bid);
      console.log(error);
      throw error;
    } finally {
      await page.close();
    }
  }

  return Promise.all(tasks);
};

const crawlCurrentPage = async (page) => {
  const totalResults = {};

  for (let i = 1; i < 9; i++) {
    if (!(await clickDateAndWait(page, i))) {
      return;
    }

    const results = crawl(await page.content());
    insertResult(totalResults, results);
  }

  return Object.values(totalResults);
};

const crawl = (content) => {
  const $ = cheerio.load(content);
  const box2InnerDivs = $("#booking_list .box2-inner");
  const date = $(".date_click_div1 p.active").attr("data-dd");

  const pageResult = [];

  box2InnerDivs.each((_, div) => {
    const themeTitle = $(div).find(".left.room_explanation_go .title")?.text() || "";
    const timeSlot = new TimeSlot(date);

    const pTags = $(div).find("p");
    pTags.each((_, pTag) => {
      const aTag = $(pTag).find("a");
      const timeMatch = $(aTag)
        ?.text()
        .match(/(\d{2}:\d{2})/);
      const time = timeMatch ? timeMatch[1] : "";
      let isAvailable = $(aTag).find("span")?.text() || "";

      if (isAvailable == "예약완료") {
        isAvailable = AvailableStatus.NOT_AVAILABLE;
      } else if (isAvailable == "예약가능") {
        isAvailable = AvailableStatus.AVAILABLE;
      }

      timeSlot.timeList.push(new Time(time, isAvailable));
    });

    pageResult.push({ themeTitle, timeSlot });
  });

  return pageResult;
};

const clickDateAndWait = async (page, index) => {
  await page.click(`#tab1 > div.box1 > div > div.date-click > div > p:nth-child(${index})`, {
    waitUntil: "load",
    timeout: 0,
  });

  return await page
    .waitForSelector("#booking_list", { visible: true, timeout: 5000 })
    .catch(() => false);
};

const insertResult = (totalResults, results) => {
  for (const { themeTitle, timeSlot } of Object.values(results)) {
    let timeLine;
    if (totalResults.hasOwnProperty(themeTitle)) {
      timeLine = totalResults[themeTitle];
    } else {
      timeLine = new TimeLine(themeTitle);
      totalResults[themeTitle] = timeLine;
    }
    totalResults[themeTitle].timeSlotList.push(timeSlot);
  }
};

export default crawlAllTimes;
