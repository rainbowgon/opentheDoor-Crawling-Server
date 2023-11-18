import flattenTimeLine from "../tools/flattenTimeLine.js";
import { createHashKey } from "../tools/hashCreator.js";

const createInsertDataTask = (timeLine, redisClient) => {
  return new Promise(async (resolve, reject) => {
    const previousData = await redisClient.hgetall("TimeLine:" + timeLine.timeLineId);

    if (check(previousData, timeLine)) {
      resolve();
      return;
    }

    await redisClient.hmset("TimeLine:" + timeLine.timeLineId, ...flattenTimeLine(timeLine));
  });
};

const check = (previous, current) => Object.keys(previous).length !== 0;

export { createInsertDataTask };
