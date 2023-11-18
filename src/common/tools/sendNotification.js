import axios from "axios";
import { SERVER_URL } from "../config/env.js";

const sendNotification = (timeLineId, targetDate, targetTime) => {
  try {
    axios.post(SERVER_URL, {
      timeLineId,
      targetDate,
      targetTime,
    });
  } catch {}
};

export default sendNotification;
