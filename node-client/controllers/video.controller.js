const { videoService: service } = require('../services');
//const client = require("../utils/grpc-clien t");

/*const testAudio = (req, res) => {
    let message = {
        fileRoute: "/assets/audios/" + "2830-3980-0043.wav"
    };
    console.log("transcribe: ",message);
    client.getTranscription(message, (err, data) => {
        if (err) console.log("err: ",err);

        console.log("Response Deepspeech", data);
        res.status(200).json(data);
    });
};*/

const processVideo = async (req, res) => {
    let message = {
        fileRoute: req.body.file // "/assets/audios/" + "2830-3980-0043.wav"
    };

    let tperfect = req.body.perfect;
    //console.log("transcribe: ",message);
    //console.log("final transcription: ",tperfect);

    // No timeout
    res.status(200).json(message);

    let staticsInfo = {
        finalName: 'v-'+Date.now()+'-'+req.body.file.split('.')[0],
        video: '/assets/classes/',
        audio: '/assets/audios/',
        videoExtension: 'mp4',
        audioExtension: 'wav',
        picExtension: 'png'
    };

    // Extract audio
    await service.splitAudio(staticsInfo.video+message.fileRoute, staticsInfo.audio+staticsInfo.finalName+'-aws.'+staticsInfo.audioExtension, 8000);
    await service.splitAudio(staticsInfo.video+message.fileRoute, staticsInfo.audio+staticsInfo.finalName+'-deepspeech.'+staticsInfo.audioExtension, 16000);

    //AWS method
    let startTimeAWS = process.hrtime();
    console.log("Send audio to S3 bucket");
    let name = await service.storeAudioToBucket(staticsInfo.audio+staticsInfo.finalName+'-aws.'+staticsInfo.audioExtension);
    console.log("Transcribe job");
    console.log(name);
    let transcription_result = await service.transcribeAudio(name);
    console.log("Start transcription time");
    let response;
    do {
        await new Promise(r => setTimeout(r, 10000));
        response = await service.lookupTranscribeCompletion(transcription_result);
        //console.log("Still waiting");
    }
    while (response.TranscriptionJob.TranscriptionJobStatus === "IN_PROGRESS");

    //console.log("Read Transcripts");
    let route = response.TranscriptionJob.Transcript.TranscriptFileUri.split("/");
    let nameS3 = route[route.length - 1];
    //let audio = await service.retrieveTranscribedAudio("ssh-aws.wav");
    let audio = await service.retrieveTranscribedAudio(nameS3);
    //console.log(audio);
    //console.log(audio.Body.toString('utf8'));

    //jsonAWS = jsonAWS.toJSON();
    let elapsedSecondsAWS = parseHrtimeToSeconds(process.hrtime(startTimeAWS));
    //console.log("AWS takes " + elapsedSecondsAWS + " seconds");
    let jsonAWS = JSON.parse(audio.Body);
    //console.log(jsonAWS);


    // DeepSpeech method
    let startTimeDS = process.hrtime();
    let jsonDeepSpeech = await service.transcribeDeepSpeech(staticsInfo.audio+staticsInfo.finalName+'-deepspeech.'+staticsInfo.audioExtension);
    let elapsedSecondsDS = parseHrtimeToSeconds(process.hrtime(startTimeDS));
    //console.log("DeepSpeech takes " + elapsedSecondsDS + " seconds");

    // compare time results
    if(elapsedSecondsAWS>=elapsedSecondsDS){
        console.log("DeepSpeech is fast by " + (elapsedSecondsAWS-elapsedSecondsDS)+ " seconds");
    } else {
        console.log("AWS is fast by " + (elapsedSecondsDS-elapsedSecondsAWS)+ " seconds");
    }

    
    //console.log("File;"+staticsInfo.finalName);
    //console.log("Times;"+elapsedSecondsAWS+";"+elapsedSecondsDS);

    // Preview Transcripts
    let tAWS = jsonAWS.results.transcripts[0].transcript;
    //console.log("AWS: ",tAWS);
    let tDS = jsonDeepSpeech.jsonTranscript;
    //console.log("Transcripts;"+tAWS+";"+tDS);

    // Compare times
    let similarity_LD_AWS = await service.levenshteinDistance(tAWS, tperfect);
    let similarity_LD_DS = await service.levenshteinDistance(tDS, tperfect);
    //console.log("Levenshtein Distance;"+(similarityAWS/tperfect.length)*100+";"+(similarityDS/tperfect.length)*100+";"+similarityAWS+";"+similarityDS);
    // trigramIndex()
    let similarity_CD_AWS = await service.cosineSimilarity(tAWS, tperfect);
    let similarity_CD_DS = await service.cosineSimilarity(tDS, tperfect);
    //console.log("Cosine Similarity;"+similarityAWS+";"+similarityDS);

    let similarity_JW_AWS = await service.jaroWrinker(tAWS, tperfect);
    let similarity_JW_DS = await service.jaroWrinker(tDS, tperfect);
    //console.log("Jaro Wrinker;"+similarityAWS+";"+similarityDS);

    // CSV Format ; delimiter
    console.log("File;Compute time;STT;Transcripts;Levenshtein Distance ABS;Levenshtein Distance % Similarity;Cosine Similarity;Jaro Wrinker");
    console.log(staticsInfo.finalName+";"+elapsedSecondsAWS+";AWS;"+tAWS+";"+similarity_LD_AWS+";"+(1-(similarity_LD_AWS/tperfect.length))+";"+similarity_CD_AWS+";"+similarity_JW_AWS);
    console.log(staticsInfo.finalName+";"+elapsedSecondsDS+";DeepSpeech;"+tDS+";"+similarity_LD_DS+";"+(1-(similarity_LD_DS/tperfect.length))+";"+similarity_CD_DS+";"+similarity_JW_DS);
};

const parseHrtimeToSeconds = (hrtime) => {
    let seconds = (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
    return seconds;
};

module.exports = {
    testAudio,
    processVideo
};
