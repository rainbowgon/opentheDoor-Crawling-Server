export default obj = (indexName) => {
  return {
    index: indexName,
    body: {
      settings: {
        index: {
          analysis: {
            tokenizer: {
              my_nori_tokenizer: {
                type: "nori_tokenizer",
                decompound_mode: "mixed",
                discard_punctuation: "false",
              },
              my_ngram_tokenizer: {
                type: "ngram",
                min_gram: 2,
                max_gram: 3,
              },
            },
            // 이 필터가 없으면 문장에서 단어 사이에 공백까지도 토큰으로 만들기 때문에 검색 품질이 저하된다.
            filter: {
              stopwords: {
                type: "stop",
                stopwords: " ", // "" 토큰은 제거된다.
              },
            },
            analyzer: {
              my_nori_analyzer: {
                type: "custom",
                tokenizer: "my_nori_tokenizer",
                filter: ["lowercase", "stop", "trim", "stopwords", "nori_part_of_speech"],
                char_filter: ["html_strip"],
              },
              my_ngram_analyzer: {
                type: "custom",
                tokenizer: "my_ngram_tokenizer",
                filter: ["lowercase", "stop", "trim", "stopwords", "nori_part_of_speech"],
                char_filter: ["html_strip"],
              },
            },
          },
        },
      },
      mappings: {
        properties: {
          title: {
            type: "text",
            analyzer: "standard",
            search_analyzer: "standard",
            fields: {
              nori: {
                type: "text",
                analyzer: "my_nori_analyzer",
                search_analyzer: "my_nori_analyzer",
              },
              ngram: {
                type: "text",
                analyzer: "my_ngram_analyzer",
                search_analyzer: "my_ngram_analyzer",
              },
            },
          },
          venue: {
            type: "text",
            analyzer: "standard",
            search_analyzer: "standard",
            fields: {
              nori: {
                type: "text",
                analyzer: "my_nori_analyzer",
                search_analyzer: "my_nori_analyzer",
              },
              ngram: {
                type: "text",
                analyzer: "my_ngram_analyzer",
                search_analyzer: "my_ngram_analyzer",
              },
            },
          },
          explanation: {
            type: "text",
            analyzer: "standard",
            search_analyzer: "standard",
            fields: {
              nori: {
                type: "text",
                analyzer: "my_nori_analyzer",
                search_analyzer: "my_nori_analyzer",
              },
              ngram: {
                type: "text",
                analyzer: "my_ngram_analyzer",
                search_analyzer: "my_ngram_analyzer",
              },
            },
          },
          genre: {
            type: "text",
            analyzer: "standard",
            search_analyzer: "standard",
            fields: {
              nori: {
                type: "text",
                analyzer: "my_nori_analyzer",
                search_analyzer: "my_nori_analyzer",
              },
              ngram: {
                type: "text",
                analyzer: "my_ngram_analyzer",
                search_analyzer: "my_ngram_analyzer",
              },
            },
          },
        },
      },
    },
  };
};
