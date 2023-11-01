import { Client } from "@elastic/elasticsearch";

const esClient = new Client({ node: "http://localhost:9200" });

const indexName = "themes";

const insertData = async (data) => {
  const body = data.flatMap((doc) => [{ index: { _index: "indexName" } }, doc]);
  await esClient.bulk({ refresh: true, body });
};

export default insertData;
