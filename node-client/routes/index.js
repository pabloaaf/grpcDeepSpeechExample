const express = require("express");
const router = express.Router();
const grpcRoutes = require('./grpc');

//display home greeting
router.get('/', (req, res) => {
  res.send('Hello World!');
});

router.use('/message', grpcRoutes);

module.exports = router;