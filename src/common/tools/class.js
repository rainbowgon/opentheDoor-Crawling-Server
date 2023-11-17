class TimeLine {
  constructor(timeLineId) {
    this.timeLineId = timeLineId;
    this.timeSlotList = [];
  }
}

class TimeSlot {
  constructor(date) {
    this.date = date;
    this.timeList = [];
  }
}

class Time {
  constructor(time, isAvailable) {
    this.time = time;
    this.isAvailable = isAvailable;
  }
}

export { TimeLine, TimeSlot, Time };
