const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const routes = require('./routes');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.use('/', routes);

// Listen
var server = app.listen(process.env.PORT, function () {
    console.log('Application port: ' + process.env.PORT);
});