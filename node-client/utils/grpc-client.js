const PROTO_PATH = __dirname + "/transcribe.proto";

const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");

var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});

const TranscribeService = grpc.loadPackageDefinition(packageDefinition).transcriber.TranscribeService;
const client = new TranscribeService(
    'vad-transcriber-server:22222',
    grpc.credentials.createInsecure()
);

module.exports = client;