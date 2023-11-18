import AvailableStatus from "../tools/enum.js";
import { flattenObjectList, flattenTimeLineObject } from "../tools/flatten.js";
import { createHash } from "../tools/hashCreator.js";

const createInsertDataTask = (timeLine, redisClient) => {
  return new Promise(async (resolve, reject) => {
    const previousData = await redisClient.hgetall(`TimeLine:${timeLine.timeLineId}`);

    if (isNotChanged(previousData, timeLine)) {
      resolve();
      return;
    }

    const flattened = flattenTimeLineObject(timeLine);
    checkEmptyTimeSlot(previousData, flattened);

    await redisClient.hmset(`TimeLine:${timeLine.timeLineId}`, ...flattenObjectList(flattened));
  });
};

const isNotChanged = (previous, current) => {
  createHash(previous) === createHash(current);
};

const checkEmptyTimeSlot = (previousTimeLine, currentTimeLine) => {
  const previousStatusKeys = filterStatusKeys(previousTimeLine);
  const currentStatusKeys = filterStatusKeys(currentTimeLine);

  if (previousStatusKeys.length !== currentStatusKeys.length) {
    return;
  }

  for (const previousKey of previousStatusKeys) {
    try {
      if (isNowEmptied(previousTimeLine, currentTimeLine, previousKey)) {
        const stringList = previousKey.split(".");
        const dateKey = stringList.slice(0, 2).join(".") + ".date";
        const timeKey = stringList.slice(0, 4).join(".") + ".time";

        if (validateDateTime(previousTimeLine, currentTimeLine, dateKey, timeKey)) {
          // 빈자리 알림
        }
      }
    } catch {
      continue;
    }
  }
};

const validateDateTime = (previousTimeLine, currentTimeLine, dateKey, timeKey) =>
  previousTimeLine[dateKey] == currentTimeLine[dateKey] &&
  previousTimeLine[timeKey] == currentTimeLine[timeKey];

const isNowEmptied = (previousTimeLine, currentTimeLine, previousKey) =>
  previousTimeLine[previousKey] == AvailableStatus.NOT_AVAILABLE &&
  currentTimeLine[previousKey] == AvailableStatus.AVAILABLE;

const filterStatusKeys = (obj) => [
  ...new Set(
    Object.keys(obj).filter((val) => typeof val === "string" && val.match(/isAvailable$/))
  ),
];

export { createInsertDataTask };
