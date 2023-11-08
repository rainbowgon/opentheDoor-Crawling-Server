import { Client } from "@elastic/elasticsearch";
import { ELASTIC_SEARCH_URL, INDEX_NAME } from "../config/env.js";

const esClient = new Client({ node: ELASTIC_SEARCH_URL });

const esInsertData = async (data) => {
  const processedData = data.map(doc => {
    return {
      poster: doc.poster || null,
      title: doc.title || null,
      venue: "마스터키 " + doc.venue || null,
      location: doc.location || null,
      tel: doc.tel || null,
      explanation: doc.explanation || null,
      level: doc.level || null,
      timeLimit: doc.timeLimit || null,
      price: doc.price || null,
      minHeadcount: doc.minHeadcount || null,
      maxHeadcount: doc.maxHeadcount || null,
      genre: doc.genre || null,
      activity: doc.activity || null,
      horror: doc.horror || null,
      lockRatio: doc.lockRatio || null,
      reservationNotice: doc.reservationNotice || null,
      latitude: doc.latitude || null,
      longitude: doc.longitude || null,
    };
  });

  const body = processedData.flatMap((doc) => [{ index: { _index: INDEX_NAME } }, doc]);
  await esClient.bulk({ refresh: true, body });
};

export default esInsertData;

