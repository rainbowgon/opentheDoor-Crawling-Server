const mongodbInsertData = async (bid, data, collection) => {
  const existingDataCount = await collection.countDocuments({ bid: bid });

  if (isDataExist(existingDataCount)) {
    await collection.updateMany({ bid: bid }, { $set: data[0] });
  } else {
    await collection.insertMany(data);
  }
};

const isDataExist = (existingDataCount) => existingDataCount > 0;

export default mongodbInsertData;
