import crypto from "crypto";

const createHash = (data) => crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");

const createHashKey = (venue, bid) => `${venue}_${bid}_hash`;

export { createHash, createHashKey };
