import esIndexObject from "./esIndexObject";

const { Client } = require("@elastic/elasticsearch"); // ElasticSearch 사용을 위한
const esClient = new Client({ node: "http://localhost:9200" });

const indexName = "themes";

async function createIndex() {
  try {
    // Check if the index already exists
    const indexExists = await esClient.indices.exists({ index: indexName });
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
