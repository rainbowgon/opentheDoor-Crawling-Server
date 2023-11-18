import AvailableStatus from "../tools/enum.js";
import { flattenObjectList, flattenTimeLineObject } from "../tools/flatten.js";
import { createHash } from "../tools/hashCreator.js";

const createInsertDataTask = (timeLine, redisClient) => {
  return new Promise(async (resolve, reject) => {
    const previousData = await redisClient.hgetall("TimeLine:" + timeLine.timeLineId);

    if (isNotChanged(previousData, timeLine)) {
      resolve();
      return;
    }

    const flattened = flattenTimeLineObject(timeLine);
    checkEmptyTimeSlot(previousData, flattened);

    await redisClient.hmset("TimeLine:" + timeLine.timeLineId, ...flattenObjectList(flattened));
  });
};

const isNotChanged = (previous, current) => {
  createHash(previous) === createHash(current);
};

const checkEmptyTimeSlot = (previousTimeLine, currentTimeLine) => {
  const previousStatusKeys = filterStatusKeys(previousTimeLine);
  const currentStatusKeys = filterStatusKeys(currentTimeLine);

  if (previousStatusKeys.length !== currentStatusKeys.length) {
    return true;
  }

  try {
    for (const previousKey of previousStatusKeys) {
      if (isEmptied(previousTimeLine, currentTimeLine, previousKey)) {
        const stringList = previousKey.split(".");
        const dateKey = stringList.slice(0, 2).join(".") + ".date";
        const timeKey = stringList.slice(0, 4).join(".") + ".time";

        if (checkDateTime(previousTimeLine, currentTimeLine, dateKey, timeKey)) {
          // console.log("\n\n");
          // console.log("There is a new empty place...");
          // console.log("Theme Title:" + currentTimeLine["timeLineId"]);
          // console.log("date:" + previousTimeLine[dateKey]);
          // console.log("time:" + previousTimeLine[timeKey]);
        }
      }
    }
  } catch (error) {}
};

const checkDateTime = (previousTimeLine, currentTimeLine, dateKey, timeKey) =>
  previousTimeLine[dateKey] == currentTimeLine[dateKey] &&
  previousTimeLine[timeKey] == currentTimeLine[timeKey];

const isEmptied = (previousTimeLine, currentTimeLine, previousKey) =>
  previousTimeLine[previousKey] == AvailableStatus.NOT_AVAILABLE &&
  currentTimeLine[previousKey] == AvailableStatus.AVAILABLE;

const filterStatusKeys = (obj) => [
  ...new Set(
    Object.keys(obj).filter((val) => typeof val === "string" && val.match(/isAvailable$/))
  ),
];

export { createInsertDataTask };
