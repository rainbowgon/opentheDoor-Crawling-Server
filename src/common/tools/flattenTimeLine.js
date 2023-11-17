const flattenTimeLine = (timeLine) => {
  const results = [];
  results.push("timeLineId");
  results.push(timeLine.timeLineId);

  const timeSlotList = timeLine.timeSlotList;
  for (var timeSlotIdx = 0; timeSlotIdx < timeSlotList.length; timeSlotIdx++) {
    const timeSlot = timeSlotList[timeSlotIdx];
    const timeSlotKey = `timeSlotList.[${timeSlotIdx}]`;
    results.push(`${timeSlotKey}.date`);
    results.push(timeSlot.date);

    const timeList = timeSlot.timeList;
    for (var timeIdx = 0; timeIdx < timeList.length; timeIdx++) {
      const time = timeList[timeIdx];
      const timeKey = `${timeSlotKey}.timeList.[${timeIdx}]`;
      results.push(`${timeKey}.time`);
      results.push(time.time);
      results.push(`${timeKey}.isAvailable`);
      results.push(time.isAvailable);
    }
  }

  return results;
};

export default flattenTimeLine;
