const AWS = require("../utils/aws-transcribe");
const exec = require('child_process').exec;
const client = require("../utils/grpc-client");

const parseHrtimeToSeconds = (hrtime) => {
    let seconds = (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
    return seconds;
};

const splitAudio = async (path, destPath, frec) => {
  return new Promise(async (resolve, reject) => {
    let command = "ffmpeg -i "+ path +" -acodec pcm_s16le -ac 1 -ar "+ frec +" "+ destPath;
    await exec(command, function( err, stdout ) {
      if(err) reject(err);
      resolve(stdout);
    });
  });
};

const storeAudioToBucket = async path => {
  try {
    return await AWS.storeAudioToBucket(path);
  } catch (error) {
    throw error;
  }
};

const transcribeAudio = async name => {
  try {
    return await AWS.transcribeAudio(name);
  } catch (error) {
    throw error;
  }
};

const lookupTranscribeCompletion = async transcription_result => {
  try {
    return await AWS.lookupTranscribeCompletion(transcription_result);
  } catch (error) {
    throw error;
  }
};

const retrieveTranscribedAudio = async name => {
  try {
    return await AWS.retrieveTranscribedAudio(name);
  } catch (error) {
    throw error;
  }
};

const transcribeDeepSpeech = async (route) => {
  return new Promise((resolve, reject) => {
    client.getTranscription({fileRoute: route}, (err, data) => {
      if (err) {console.log("err: ", err); reject(err);}

      //console.log("Response Deepspeech", data);
      resolve(data);
    });
  });
};

const levenshteinDistance =  (a, b) => {
  if(a.length == 0) return b.length;
  if(b.length == 0) return a.length;

  // Create empty edit distance matrix for all possible modifications of
  // substrings of a to substrings of b.
  const distanceMatrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));


  // Fill the first row of the matrix.
  // If this is first row then we're transforming empty string to a.
  // In this case the number of transformations equals to size of a substring.
  for (let i = 0; i <= a.length; i += 1) {
    distanceMatrix[0][i] = i;
  }

  // Fill the first column of the matrix.
  // If this is first column then we're transforming empty string to b.
  // In this case the number of transformations equals to size of b substring.
  for (let j = 0; j <= b.length; j += 1) {
    distanceMatrix[j][0] = j;
  }

  // Fill in the rest of the matrix
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      distanceMatrix[j][i] = Math.min(
        distanceMatrix[j][i - 1] + 1, // deletion
        distanceMatrix[j - 1][i] + 1, // insertion
        distanceMatrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  return distanceMatrix[b.length][a.length];
};

/*const trigramIndex = (a, b) => {
  let asTrigrams = (phrase, callback) => {
    let rawData = "  ".concat(phrase, "  ");
    for (let i = rawData.length - 3; i >= 0; i = i - 1)
      callback.call(this, rawData.slice(i, i + 3));
  };
  let instance = {
    phrases: [],
    trigramIndex: [],
    index: function (phrase) {
      if (!phrase || phrase === "" || this.phrases.indexOf(phrase) >= 0) return;
      let phraseIndex = this.phrases.push(phrase) - 1;
      asTrigrams.call(this, phrase, function (trigram) {
        let phrasesForTrigram = this.trigramIndex[trigram];
        if (!phrasesForTrigram) phrasesForTrigram = [];
        if (phrasesForTrigram.indexOf(phraseIndex) < 0) phrasesForTrigram.push(phraseIndex);
        this.trigramIndex[trigram] = phrasesForTrigram;
      });
    },
    find: function (phrase) {
      let phraseMatches = [];
      let trigramsInPhrase = 0;
      asTrigrams.call(this, phrase, function (trigram) {
        let phrasesForTrigram = this.trigramIndex[trigram];
        trigramsInPhrase += 1;
        if (phrasesForTrigram)
          for (let j in phrasesForTrigram) {
            let phraseIndex = phrasesForTrigram[j];
            if (!phraseMatches[phraseIndex]) phraseMatches[phraseIndex] = 0;
            phraseMatches[phraseIndex] += 1;
          }
      });
      let result = [];
      for (let i in phraseMatches)
        result.push({ phrase: this.phrases[i], matches: phraseMatches[i] });

      result.sort(function (a, b) {
        return b.matches - a.matches;// == 0 ? a.phrase.localeCompare(b.phrase) : diff;
      });
      return result;
    }
  };
  instance.index(a);
  instance.index(b);
  return instance;
};*/

const cosineSimilarity = (a,b)=> {
    let termFreqA = termFreqMap(a);
    let termFreqB = termFreqMap(b);

    let dict = {};
    addKeysToDict(termFreqA, dict);
    addKeysToDict(termFreqB, dict);

    let termFreqVecA = termFreqMapToVector(termFreqA, dict);
    let termFreqVecB = termFreqMapToVector(termFreqB, dict);

    return vecDotProduct(termFreqVecA, termFreqVecB) / (vecMagnitude(termFreqVecA) * vecMagnitude(termFreqVecB));
};

const termFreqMap = (str) => {
  let words = str.split(' ');
  let termFreq = {};
  words.forEach(function(w) {
    termFreq[w] = (termFreq[w] || 0) + 1;
  });
  return termFreq;
};

const addKeysToDict = (map, dict) => {
  for (let key in map) {
    dict[key] = true;
  }
};

const termFreqMapToVector = (map, dict) => {
  let termFreqVector = [];
  for (let term in dict) {
    termFreqVector.push(map[term] || 0);
  }
  return termFreqVector;
};

const vecDotProduct = (vecA, vecB) => {
  let product = 0;
  for (let i = 0; i < vecA.length; i++) {
    product += vecA[i] * vecB[i];
  }
  return product;
};

const vecMagnitude = (vec) => {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
};

const jaroWrinker  = (s1, s2) => {
  let m = 0;

  // Exit early if either are empty.
  if ( s1.length === 0 || s2.length === 0 ) {
    return 0;
  }

  // Exit early if they're an exact match.
  if ( s1 === s2 ) {
    return 1;
  }

  let range = (Math.floor(Math.max(s1.length, s2.length) / 2)) - 1,
      s1Matches = new Array(s1.length),
      s2Matches = new Array(s2.length);

  for (let i = 0; i < s1.length; i++ ) {
    let low  = (i >= range) ? i - range : 0,
        high = (i + range <= s2.length) ? (i + range) : (s2.length - 1);

    for (let j = low; j <= high; j++ ) {
      if ( s1Matches[i] !== true && s2Matches[j] !== true && s1[i] === s2[j] ) {
        ++m;
        s1Matches[i] = s2Matches[j] = true;
        break;
      }
    }
  }

  // Exit early if no matches were found.
  if ( m === 0 ) {
    return 0;
  }

  // Count the transpositions.
  let k = 0;
  let n_trans = 0;

  for (let i = 0; i < s1.length; i++ ) {
    if ( s1Matches[i] === true ) {
      for (let j = k; j < s2.length; j++ ) {
        if ( s2Matches[j] === true ) {
          k = j + 1;
          break;
        }
      }

      if ( s1[i] !== s2[s2.length-1] ) {
        ++n_trans;
      }
    }
  }

  let weight = (m / s1.length + m / s2.length + (m - (n_trans / 2)) / m) / 3;
  let l = 0;
  let p = 0.1;

  if ( weight > 0.7 ) {
    while ( s1[l] === s2[l] && l < 4 ) {
      ++l;
    }

    weight = weight + l * p * (1 - weight);
  }

  return weight;
};


module.exports = {
  splitAudio,
  storeAudioToBucket,
  transcribeAudio,
  lookupTranscribeCompletion,
  retrieveTranscribedAudio,
  transcribeDeepSpeech,
  levenshteinDistance,
  // trigramIndex,
  cosineSimilarity,
  jaroWrinker
};
