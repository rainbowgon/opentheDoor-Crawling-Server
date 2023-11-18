const flattenObjectList = (obj) => {
  const results = [];

  for (const [key, value] of Object.entries(obj)) {
    results.push(key);
    results.push(value);
  }

  return results;
};

const flattenTimeLineObject = (timeLine) => {
  const results = {};
  results["timeLineId"] = timeLine.timeLineId;

  const timeSlotList = timeLine.timeSlotList;
  for (var timeSlotIdx = 0; timeSlotIdx < timeSlotList.length; timeSlotIdx++) {
    const timeSlot = timeSlotList[timeSlotIdx];
    const timeSlotKey = `timeSlotList.[${timeSlotIdx}]`;

    results[`${timeSlotKey}.date`] = timeSlot.date;

    const timeList = timeSlot.timeList;
    for (var timeIdx = 0; timeIdx < timeList.length; timeIdx++) {
      const time = timeList[timeIdx];
      const timeKey = `${timeSlotKey}.timeList.[${timeIdx}]`;
      results[`${timeKey}.time`] = time.time;
      results[`${timeKey}.isAvailable`] = time.isAvailable;
    }
  }

  return results;
};

export { flattenObjectList, flattenTimeLineObject };
