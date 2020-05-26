const express = require("express");
const router = express.Router();
const { videoController: controller }=require("../controllers/");

// router.get('/test', controller.testAudio);

router.post('/', (req, res, next) => {
    req.setTimeout(0); // no timeout to process the video
    next();
});

router.post('/', controller.processVideo);

module.exports = router;