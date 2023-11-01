import { Client } from "@elastic/elasticsearch";
import { ELASTIC_SEARCH_URL } from "../tools/config";

const esClient = new Client({ node: ELASTIC_SEARCH_URL });

const INDEX_NAME = "themes";

const insertData = async (data) => {
  const body = data.flatMap((doc) => [{ index: { _index: INDEX_NAME } }, doc]);
  await esClient.bulk({ refresh: true, body });
};

export default insertData;
