import crypto from "crypto";

const createHash = (data) => crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");

const createTimeLineId = (themeTitle, originalUrl) => `${themeTitle}_${originalUrl}`;

export { createHash, createTimeLineId };
