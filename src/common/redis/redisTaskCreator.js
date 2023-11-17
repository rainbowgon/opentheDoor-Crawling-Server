import { createHashKey } from "../tools/hashCreator.js";

const createInsertDataTask = (venue, bid, results, redisClient) => {
  for (const result of results) {
    const { themeTitle, timePossibleList } = result;
    // const HASH_KEY = createHashKey(venue, bid);

    console.log(timePossibleList);

    return new Promise((resolve, reject) => {
      redisClient.get(themeTitle, async (error, previousData) => {
        if (error) {
          console.error(error);
          return reject(error);
        }

        if (isNotChanged(previousData, timePossibleList)) {
          resolve();
          return;
        }

        redisClient.hmset(themeTitle, ...timePossibleList, async (error) => {
          if (error) {
            console.error(error);
            return reject(error);
          }

          resolve();
        });
      });
    });
  }
};

const isNotChanged = (previous, current) => previous && previous === current;

export { createInsertDataTask };
