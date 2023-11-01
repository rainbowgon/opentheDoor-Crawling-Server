import { Client } from "@elastic/elasticsearch";
import { ELASTIC_SEARCH_URL } from "../tools/config";

const esClient = new Client({ node: ELASTIC_SEARCH_URL });

const indexName = "themes";

const insertData = async (data) => {
  const body = data.flatMap((doc) => [{ index: { _index: indexName } }, doc]);
  await esClient.bulk({ refresh: true, body });
};

export default insertData;
