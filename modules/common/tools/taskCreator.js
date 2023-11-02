import mongodbInsertData from "../mongodb/mongodbInsertData.js";
import { createHash, createHashKey } from "./hashCreator.js";

const createInsertDataTask = (venue, bid, data, collection, redisClient) => {
  const hash = createHash(data);
  const HASH_KEY = createHashKey(venue, bid);

  return new Promise((resolve, reject) => {
    redisClient.get(HASH_KEY, async (error, previousHash) => {
      if (error) {
        console.error(error);
        return reject(error);
      }

      if (isNotChanged(previousHash, hash)) {
        resolve();
        return;
      }

      redisClient.set(HASH_KEY, hash, async (error) => {
        if (error) {
          console.error(error);
          return reject(error);
        }

        await mongodbInsertData(bid, data, collection);

        resolve();
      });
    });
  });
};

const isNotChanged = (previousHash, currentHash) => previousHash && previousHash === currentHash;

export { createInsertDataTask };
