import esIndexObject from "./esIndexObject";
import { Client } from "@elastic/elasticsearch";
import { ELASTIC_SEARCH_URL } from "../tools/config";

const esClient = new Client({ node: ELASTIC_SEARCH_URL });

const INDEX_NAME = "themes";

async function createIndex() {
  try {
    // Check if the index already exists
    const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
    if (indexExists) {
      await esClient.indices.delete({ index: indexName });
    }

    await create();
  } catch (error) {
    console.error("Error creating index:", error);
  }
}

const create = async () => {
  esClient.indices.create(esIndexObject(indexName));
};

export default createIndex;
