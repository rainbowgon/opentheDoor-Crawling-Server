const { Client } = require("@elastic/elasticsearch"); // ElasticSearch 사용을 위한
const esClient = new Client({ node: "http://localhost:9200" });

const insert = async (data) => {
  const body = data.flatMap((doc) => [{ index: { _index: "themes" } }, doc]);
  await esClient.bulk({ refresh: true, body });
};

export default insert;
