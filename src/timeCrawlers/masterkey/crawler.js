import { createTargetUrl } from "../../common/config/masterkey.js";
import { createInsertDataTask } from "../../common/redis/redisTaskCreator.js";
import { createPage } from "../../common/tools/browser.js";
import { Time, TimeLine, TimeSlot } from "../../common/tools/class.js";
import AvailableStatus from "../../common/tools/enum.js";
import * as cheerio from "cheerio";
import { createTimeLineId } from "../../common/tools/hashCreator.js";

const crawlAllTimes = async (bids, browser, redisClient) => {
  const tasks = [];

  for (const bid of bids) {
    const page = await createPage(browser);
    const targetUrl = createTargetUrl(bid);
    await Promise.all([
      page.waitForNavigation(),
      page.goto(targetUrl),
      page.waitForSelector("#tab1 > div.box1 > div > div.date-click > div"),
    ]);

    const timeLines = await crawlCurrentPage(targetUrl, page);
    for (const timeLine of timeLines) {
      tasks.push(createInsertDataTask(timeLine, redisClient));
    }
    await page.close();
  }

  return Promise.all(tasks);
};

const crawlCurrentPage = async (targetUrl, page) => {
  const totalResults = {};

  for (let i = 1; i < 9; i++) {
    if (!(await clickDateAndWait(page, i))) {
      return;
    }

    const results = crawl(targetUrl, await page.content());
    insertResult(totalResults, results);
  }

  return Object.values(totalResults);
};

const crawl = (targetUrl, content) => {
  const $ = cheerio.load(content);
  const venueTitle = $("h2.theme-title").text().trim();

  const box2InnerDivs = $("#booking_list .box2-inner");
  const date = $(".date_click_div1 p.active").attr("data-dd");

  const pageResult = [];

  box2InnerDivs.each((_, div) => {
    const themeTitle = $(div).find(".left.room_explanation_go .title")?.text().trim() || "";
    const timeSlot = new TimeSlot(date);

    const pTags = $(div).find("p");
    pTags.each((_, pTag) => {
      const aTag = $(pTag).find("a");
      const timeMatch = $(aTag)
        ?.text()
        .match(/(\d{2}:\d{2})/);
      const time = timeMatch ? timeMatch[1] : "";
      let isAvailable = $(aTag).find("span")?.text().trim() || "";

      if (isAvailable == "예약완료") {
        isAvailable = AvailableStatus.NOT_AVAILABLE;
      } else if (isAvailable == "예약가능") {
        isAvailable = AvailableStatus.AVAILABLE;
      } else {
        console.log("New Status: ", isAvailable);
        isAvailable = AvailableStatus.NOT_AVAILABLE;
      }

      timeSlot.timeList.push(new Time(time, isAvailable));
    });

    const timeLineId = createTimeLineId(themeTitle, targetUrl);
    pageResult.push({ timeLineId, timeSlot });
  });

  return pageResult;
};

const clickDateAndWait = async (page, index) => {
  return Promise.all([
    page.click(`#tab1 > div.box1 > div > div.date-click > div > p:nth-child(${index})`),
    page.waitForSelector("#booking_list", { visible: true }),
  ]).catch(() => false);
};

const insertResult = (totalResults, results) => {
  for (const { timeLineId, timeSlot } of Object.values(results)) {
    let timeLine;
    if (totalResults.hasOwnProperty(timeLineId)) {
      timeLine = totalResults[timeLineId];
    } else {
      timeLine = new TimeLine(timeLineId);
      totalResults[timeLineId] = timeLine;
    }
    totalResults[timeLineId].timeSlotList.push(timeSlot);
  }
};

export default crawlAllTimes;
