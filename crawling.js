const puppeteer = require('puppeteer'); // 크롤링을 위한 라이브러리
const { MongoClient } = require('mongodb'); // MongoDB 사용을 위한 라이브러리
const Redis = require('ioredis'); // Redis 사용을 위한 라이브러리
const crypto = require('crypto'); // Hash데이터로 변경을 위한 라이브러리
const { Client } = require('@elastic/elasticsearch'); // ElasticSearch사용을 위한
const esClient = new Client({ node: 'http://localhost:9200' });



(async () => {
  console.time('Total Execution Time');  // 시간 측정 시작

  const browser = await puppeteer.launch({
    headless: true,  // 헤드리스 브라우저 사용(리소스 감소)
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const uri = "mongodb://rainbow:rainbowA307@127.0.0.1:27017";
  const client = new MongoClient(uri);
  const redisClient = new Redis();  // Redis 클라이언트 생성

  try {
    await client.connect();
    const db = client.db("Escape"); // db 연결
    const collection = db.collection("room"); // collection(mysql 테이블 느낌)

    const deleteResult = await collection.deleteMany({});
    // console.log('Number of documents deleted:', deleteResult.deletedCount); 기존 데이터 삭제

    createIndex();


    const successfulBids = [ 1, 2, 7, 8, 10, 11, 12,
        13, 14, 16, 18, 19, 20, 21, 23,
        24, 26, 27, 28, 29, 30, 31, 32, // 지점 아이디가 0~40 이였는데 이 중 데이터가 존재하는 것만 골라냄
        35, 36, 40 ];

    const parallelBatches = 4; 
    const tasks = [];
    for (let i = 0; i < successfulBids.length; i += parallelBatches) {
      const batch = successfulBids.slice(i, i + parallelBatches);      // 병렬처리를 위해 설정
      tasks.push(crawlPages(batch, browser, collection, redisClient));
    }

    await Promise.all(tasks);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
    await client.close();
    redisClient.quit();  // Redis 클라이언트 종료
    console.timeEnd('Total Execution Time');
  }
})();

async function createIndex() {
  try {
    // Check if the index already exists
    const indexExists = await esClient.indices.exists({ index: 'themes' });
    if (indexExists) {
      console.log('Index already exists. Deleting old index.');
      await esClient.indices.delete({ index: 'themes' });
    }

    // Create a new index with the specified settings and mappings
    const response = await esClient.indices.create({
    index: 'themes',
    body: {
      "settings": {
        "index": {
          "analysis": {
            "tokenizer": {
              "my_nori_tokenizer": {
                "type": "nori_tokenizer",
                "decompound_mode": "mixed",
                "discard_punctuation": "false"
              },
              "my_ngram_tokenizer": {
                "type": "ngram",
                "min_gram": 2,
                "max_gram": 3
              }
            },
            // 이 필터가 없으면 문장에서 단어 사이에 공백까지도 토큰으로 만들기 때문에 검색 품질이 저하된다.
            "filter": {
              "stopwords": {
                "type": "stop",
                "stopwords": " " // "" 토큰은 제거된다.
              }
            },
            "analyzer": {
              "my_nori_analyzer": {
                "type": "custom",
                "tokenizer": "my_nori_tokenizer",
                "filter": ["lowercase", "stop", "trim", "stopwords", "nori_part_of_speech"],
                "char_filter": ["html_strip"]
              },
              "my_ngram_analyzer": {
                "type": "custom",
                "tokenizer": "my_ngram_tokenizer",
                "filter": ["lowercase", "stop", "trim", "stopwords",  "nori_part_of_speech"],
                "char_filter": ["html_strip"]
              }
            }
          }
        }
      },
      "mappings" : {
        "properties" : {
            "title": {
                "type" : "text",
                "analyzer": "standard",
                "search_analyzer": "standard",
                "fields": {
                    "nori": { 
                        "type": "text",
                        "analyzer": "my_nori_analyzer",
                        "search_analyzer": "my_nori_analyzer"
                    },
                    "ngram": { 
                        "type": "text", 
                        "analyzer": "my_ngram_analyzer",
                        "search_analyzer": "my_ngram_analyzer"
                    }
                }
            },
            "venue": {
                "type" : "text",
                "analyzer": "standard",
                "search_analyzer": "standard",
                "fields": {
                    "nori": { 
                        "type": "text",
                        "analyzer": "my_nori_analyzer",
                        "search_analyzer": "my_nori_analyzer"
                    },
                    "ngram": { 
                        "type": "text", 
                        "analyzer": "my_ngram_analyzer",
                        "search_analyzer": "my_ngram_analyzer"
                    }
                }
            },
            "explanation": {
                "type" : "text",
                "analyzer": "standard",
                "search_analyzer": "standard",
                "fields": {
                    "nori": { 
                        "type": "text",
                        "analyzer": "my_nori_analyzer",
                        "search_analyzer": "my_nori_analyzer"
                    },
                    "ngram": { 
                        "type": "text", 
                        "analyzer": "my_ngram_analyzer",
                        "search_analyzer": "my_ngram_analyzer"
                    }
                }
            },
            "genre": {
                "type" : "text",
                "analyzer": "standard",
                "search_analyzer": "standard",
                "fields": {
                    "nori": { 
                        "type": "text",
                        "analyzer": "my_nori_analyzer",
                        "search_analyzer": "my_nori_analyzer"
                    },
                    "ngram": { 
                        "type": "text", 
                        "analyzer": "my_ngram_analyzer",
                        "search_analyzer": "my_ngram_analyzer"
                    }
                }
            }
        }
    }
  }
});


    console.log('Index created successfully:', response.body);
  } catch (error) {
    console.error('Error creating index:', error);
  }
}


async function indexDataToElasticsearch(data) {
  const body = data.flatMap(doc => [{ index: { _index: 'themes' } }, doc]);
  await esClient.bulk({ refresh: true, body });
}


async function crawlPages(bids, browser, collection, redisClient) {
  const page = await browser.newPage();
  const redisTasks = [];
  await page.setRequestInterception(true);  // 리소스 제한을 위해 요청 가로채기 활성화
  page.on('request', request => {
    const resourceType = request.resourceType();
    if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
      request.abort();  // 이미지, CSS, 폰트 등의 리소스 로딩 차단
    } else {
      request.continue();
    }
  });

  for (const bid of bids) {
    console.time(`Execution time for bid=${bid}`);
    await page.goto(`https://www.master-key.co.kr/booking/bk_detail?bid=${bid}`);

    const divExists = await page.waitForSelector('#booking_list', { visible: true, timeout: 5000 }).catch(() => false);

    if (divExists) {
        const data = await page.evaluate((bid) => {
            const bookingListDiv = document.getElementById('booking_list');
            const box2InnerDivs = bookingListDiv.querySelectorAll('.box2-inner');
            const results = [];
            const venue = document.querySelector('.theme-title')?.innerText || '';
            // 크롤링 해오는 부분
            box2InnerDivs.forEach(div => {
              const title = div.querySelector('.left.room_explanation_go .title')?.innerText || '';
              const explanation = div.querySelector('.left.room_explanation_go')?.dataset.text || '';
              const img = div.querySelector('img')?.src || '';
              const genre = div.querySelector('.right .info .hashtags')?.innerText || '';
              const genreArray = genre.split(' ').map(tag => tag.replace(/#/g, '').trim());  // Split the text by '#' and trim each item
              const spanTags = div.querySelector('.right .info').querySelectorAll('span');
              const levelText = spanTags[0]?.innerText || '';
              const keySymbol = '🔑';  // Define the key symbol
              const level = levelText.split(keySymbol).length - 1;  // Count the occurrences of the key symbol
              const headcount = spanTags[1]?.innerText.match(/(\d~\d명)/)?.[1] || ''.split('~');
              const minHeadcount = parseInt(headcount[0], 10);
              const maxHeadcount = parseInt(headcount[2], 10);
              const pTags = div.querySelectorAll('p');
              const timePossibleList = [];
              pTags.forEach(pTag => {
                const aTag = pTag.querySelector('a');
                const timeMatch = aTag?.textContent.match(/(\d{2}:\d{2})/);
                const time = timeMatch ? timeMatch[1] : '';
                const possible = aTag?.querySelector('span')?.textContent || '';
                timePossibleList.push({ time, possible });
              });
              
        
              results.push({
                venue,
                title,
                explanation,
                img,
                genre : genreArray,
                level,
                minHeadcount,
                maxHeadcount,
                timePossibleList
              });
            });
            return results;
        },bid);
      const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'); // 해시 데이터 변환

            // Redis 작업을 프로미스로 래핑
            const redisTask = new Promise((resolve, reject) => {
              redisClient.get(`${bid}_hash`, async (err, previousHash) => {
                  if (err) return reject(err);
          
                  if (previousHash && previousHash === hash) {
                      // console.log(`No data change detected for bid=${bid}`);
                      resolve();
                  } else {
                      // 이 bid에 대한 데이터가 데이터베이스에 이미 있는지 확인
                      const existingDataCount = await collection.countDocuments({ bid: bid });
          
                      if (existingDataCount > 0) {
                          // 데이터가 있으므로 updateMany 사용
                          redisClient.set(`${bid}_hash`, hash, async (err) => {
                              if (err) return reject(err);
          
                              // 데이터 업데이트
                              await collection.updateMany({ bid: bid }, { $set: data[0] });  // data가 배열이라고 가정하고 첫 번째 요소 사용
                              resolve();
                          });
                      } else {
                          // 데이터가 없으므로 insertMany 사용
                          redisClient.set(`${bid}_hash`, hash, async (err) => {
                              if (err) return reject(err);
          
                              // 데이터 삽입
                              await collection.insertMany(data);
                              resolve();
                          });
                      }
                  }
              });
          });
        
              redisTasks.push(redisTask);
               // Elasticsearch에 데이터 저장
              await indexDataToElasticsearch(data);
    } else {
      console.log(`No booking list found for bid=${bid}`);
    }

    // console.timeEnd(`Execution time for bid=${bid}`);
  }
  
  await page.close();
  return Promise.all(redisTasks);
}
