const URL = "https://www.master-key.co.kr/booking/bk_detail";

export const VENUE = "masterkey";
export const BID_LIST = [
  1, 2, 7, 8, 10, 11, 12, 13, 14, 16, 18, 19, 20, 21, 23, 24, 26, 27, 28, 29, 30, 31, 32, 35, 36,
  40,
  
];
export const createTargetUrl = (bid) => `${URL}?bid=${bid}`;
