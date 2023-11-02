import { Client } from "@elastic/elasticsearch";
import esIndexObject from "./esIndexObject.js";
import { ELASTIC_SEARCH_URL, INDEX_NAME } from "../tools/config.js";

const esClient = new Client({ node: ELASTIC_SEARCH_URL });

const createIndex = async () => {
  try {
    // Check if the index already exists
    const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
    if (indexExists) {
      await esClient.indices.delete({ index: INDEX_NAME });
    }

    await create(INDEX_NAME);
  } catch (error) {
    console.error("Error creating index:", error);
  }
};

const create = async (indexName) => {
  esClient.indices.create(esIndexObject(indexName));
};

export default createIndex;
