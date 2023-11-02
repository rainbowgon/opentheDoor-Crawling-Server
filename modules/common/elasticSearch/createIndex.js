import { Client } from "@elastic/elasticsearch";
import esIndexObject from "./esIndexObject.js";
import { ELASTIC_SEARCH_URL, INDEX_NAME } from "../tools/config.js";

const esClient = new Client({ node: ELASTIC_SEARCH_URL });

const createIndex = async () => {
  try {
    await deleteIndex(INDEX_NAME);
    await create(INDEX_NAME);
  } catch (error) {
    console.error("Error creating index:", error);
  }
};

const deleteIndex = async (indexName) => {
  const isIndexExist = await esClient.indices.exists({ index: indexName });
  if (isIndexExist) {
    await esClient.indices.delete({ index: indexName });
  }
};

const create = async (indexName) => {
  esClient.indices.create(esIndexObject(indexName));
};

export default createIndex;
