//aws-transcribe.js
const AWS = require("aws-sdk");
const fs = require("fs");

//let awsConfig = new AWS.Config();
const AWSConfig = {
	region: process.env.AWS_REGION, // This is the only AWS region outside the US that supports transcribe API
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
}; // sslEnabled: true, // This is optional

const s3 = new AWS.S3(AWSConfig);
AWS.config.update({region: 'us-east-1'});
const transcribe = new AWS.TranscribeService(AWSConfig);

function storeAudioToBucket(path) {
	return new Promise((resolve, reject) => {
		console.log(path);

		// Read content from the file
		const fileContent = fs.readFileSync(path+'');
	   
	    let audioName = path.split("/");
		console.log(audioName[audioName.length - 1]);

		// Setting up S3 upload parameters
        const params = {
            Body: fileContent,
            Bucket: process.env.S3_AUDIO_BUCKET,
            Key: audioName[audioName.length - 1],
        };

        // Uploading files to the bucket
        s3.upload(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                reject(err);
            }
            else {
            	console.log(data);
                resolve(params.Key);
            }
        });
    });
}

function transcribeAudio(audioName) {
	return new Promise((resolve, reject) => {
		const s3URL = 'https://s3.amazonaws.com/' + process.env.S3_AUDIO_BUCKET + "/";
        //let finalName = audioName.replace(/./g,"");
        let finalName = audioName;
        finalName = finalName.replace(/_/g,"");
        finalName = finalName.substring(0,59);
        const params = {
			LanguageCode: 'en-US',
			Media: {MediaFileUri: s3URL +audioName+ ""},
			MediaSampleRateHertz: 8000,
			MediaFormat: 'wav',
			TranscriptionJobName: "job"+finalName,
			OutputBucketName: process.env.S3_AUDIO_BUCKET
	  	};
        transcribe.startTranscriptionJob(params, function (err, data) {
	        if (err) {
	            console.log(err, err.stack);
	            reject(err);
	        }
	        else {
	            resolve(data);
	        }
	    });
	});
}

function lookupTranscribeCompletion(transcript) {
	return new Promise((resolve, reject) => {
		const transcription = (typeof transcript === 'string' || transcript instanceof String) ? transcript : transcript.TranscriptionJob.TranscriptionJobName;
		
		const params = {
	        TranscriptionJobName: transcription,
	    };

	    transcribe.getTranscriptionJob(params, function (err, data) {
	        if (err) {
	            console.log(err, err.stack);
	            reject(err);
	        }
	        else {
	        	//console.log(data);
	            resolve(data);
	        }
	    });
	});
}

async function retrieveTranscribedAudio(transcript) {
	return await s3.getObject({ Bucket: process.env.S3_AUDIO_BUCKET, Key: transcript }).promise();
}

module.exports = {
    storeAudioToBucket,
    transcribeAudio,
    lookupTranscribeCompletion,
    retrieveTranscribedAudio
};