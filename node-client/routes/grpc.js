const express = require("express");
const router = express.Router();
const client = require("../utils/grpc-client");

router.get('/test', (req, res) => {
	let message = {
        fileRoute: "2830-3980-0043.wav"
    };
    console.log("transcribe: ",message);
    client.getTranscription(message, (err, data) => {
        if (err) console.log("err: ",err);

        console.log("Response Deepspeech", data);
		res.status(200).json(data);
    });
});

router.post('/', (req, res) => {
	let message = {
        fileRoute: req.body.file //2830-3980-0043.wav
    };
    console.log("transcribe: ",message);
    client.getTranscription(message, (err, data) => {
        if (err) console.log("err: ",err);

        console.log("Response Deepspeech", data);
		res.status(200).json(data);
    });
});

module.exports = router;