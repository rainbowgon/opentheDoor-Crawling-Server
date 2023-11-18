import { Client } from "@elastic/elasticsearch";
import esIndexObject from "./esIndexObject.js";
import { ELASTIC_SEARCH_URL, INDEX_NAME } from "../config/env.js";

const createIndex = async () => {
  const esClient = new Client({ node: ELASTIC_SEARCH_URL });
  try {
    await deleteIndex(esClient);
    await create(esClient);
  } catch (error) {
    console.error("Error creating index:", error);
  }
};

const deleteIndex = async (esClient) => {
  const isIndexExist = await esClient.indices.exists({ index: INDEX_NAME });
  if (isIndexExist) {
    await esClient.indices.delete({ index: INDEX_NAME });
  }
};

const create = async (esClient) => {
  esClient.indices.create(esIndexObject(INDEX_NAME));
};

export default createIndex;
