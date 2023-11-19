import axios from "axios";
import { SERVER_URL, NOTIFY_ON_OFF } from "../config/env.js";

const sendNotification = (timeLineId, targetDate, targetTime) => {
  if (NOTIFY_ON_OFF == "OFF") {
    return;
  }
  axios
    .post(`${SERVER_URL}/reservation-service/waitings/unauth/notify/empty-slot`, {
      timeLineId,
      targetDate,
      targetTime,
    })
    .catch((error) => console.error(error));
};

export default sendNotification;
