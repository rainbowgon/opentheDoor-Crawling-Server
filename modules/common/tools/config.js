import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export const ELASTIC_SEARCH_URL = process.env.ELASTIC_SEARCH_URL;
export const MONGODB_URL = process.env.MONGODB_URL;
export const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;
export const MONGODB_COLLECTION_NAME = process.env.MONGODB_COLLECTION_NAME;
export const INDEX_NAME = process.env.INDEX_NAME;
