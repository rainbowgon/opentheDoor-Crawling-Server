import { Client } from "@elastic/elasticsearch";
import { ELASTIC_SEARCH_URL, INDEX_NAME } from "../tools/config.js";

const esClient = new Client({ node: ELASTIC_SEARCH_URL });

const esInsertData = async (data) => {
  const body = data.flatMap((doc) => [{ index: { _index: INDEX_NAME } }, doc]);
  await esClient.bulk({ refresh: true, body });
};

export default esInsertData;
