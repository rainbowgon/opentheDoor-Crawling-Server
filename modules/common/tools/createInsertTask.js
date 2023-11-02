import mongodbInsertData from "../mongodb/mongodbInsertData.js";
import { createHash, createHashKey } from "./hashCreator.js";

const createInsertTask = (venue, bid, data, collection, redisClient) => {
  const hash = createHash(data);
  const HASH_KEY = createHashKey(venue, bid);

  return new Promise((resolve, reject) => {
    redisClient.get(HASH_KEY, async (error, previousHash) => {
      if (error) return reject(error);

      if (!isChanged(previousHash, hash)) {
        resolve();
        return;
      }

      redisClient.set(HASH_KEY, hash, async (error) => {
        if (error) return reject(error);

        await mongodbInsertData(bid, data, collection);

        resolve();
      });
    });
  });
};

const isChanged = (previousHash, currentHash) => previousHash && previousHash === currentHash;

export default createInsertTask;
