import geocodeAddress from "../tools/geocoding.js";

function getGeocodeForLocation(location) {
  // 주소를 공백으로 나눕니다.
  const parts = location.split(' ');

  // 숫자 2자리가 나오는 부분까지의 주소를 찾습니다.
  let addressForGeocoding = '';
  for (const part of parts) {
    addressForGeocoding += part + ' ';
    if (part.match(/^\d{2}$/)) {
      // 숫자 2자리를 발견하면 반복을 멈춥니다.
      break;
    }
  }

  // 추출된 주소를 트림하여 마지막 공백을 제거합니다.
  addressForGeocoding = addressForGeocoding.trim();

  // 추출된 주소로 지오코딩을 수행합니다.
  return addressForGeocoding;
}

const processDocument  = (doc) => ({
      poster: doc.poster || null,
      title: doc.title || null,
      venue: "마스터키 " + doc.venue || null,
      location: doc.location || null,
      tel: doc.tel || null, 
      explanation: doc.explanation || null,
      level: doc.level || null,
      timeLimit: doc.timeLimit || null,
      price: doc.price || null,
      minHeadcount: doc.minHeadcount || null,
      maxHeadcount: doc.maxHeadcount || null,
      genre: doc.genre || null,
      activity: doc.activity || null,
      horror: doc.horror || null,
      lockRatio: doc.lockRatio || null,
      reservationNotice: doc.reservationNotice || null,
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
