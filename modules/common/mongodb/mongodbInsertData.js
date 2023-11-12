const processDocument  = (doc) => ({
      poster: doc.poster || null,
      title: doc.title || null,
      venue: "마스터키 " + doc.venue || null,
      location: doc.location || null,
      tel: doc.tel || null, 
      explanation: doc.explanation || null,
      level: doc.level || null,
      timeLimit: doc.timeLimit || null,
      priceList: doc.priceList ||  
                            [
                              {
                                  "headcount": 2,
                                  "price": 22000
                              },
                              {
                                  "headcount": 3,
                                  "price": 20000
                              },
                              {
                                  "headcount": 4,
                                  "price": 18000
                              }
                            ],
      minHeadcount: doc.minHeadcount || null,
      maxHeadcount: doc.maxHeadcount || null,
      genre: doc.genre || null,
      activity: doc.activity || null,
      horror: doc.horror || null,
      lockRatio: doc.lockRatio || null,
      venueToS : doc.venueToS  || null,
      latitude: doc.latitude || null,
      longitude: doc.longitude || null,
  });

  const mongodbInsertData = async (bid, data, collection) => {
    const processedData = data.map(doc => processDocument(doc));
  
    const existingDataCount = await collection.countDocuments({ bid: bid });
  
    if (isDataExist(existingDataCount)) {
      await collection.updateMany({ bid: bid }, { $set: processedData[0] });
    } else {
      await collection.insertMany(processedData);
    }
  };
  

const isDataExist = (existingDataCount) => existingDataCount > 0;

export default mongodbInsertData;
