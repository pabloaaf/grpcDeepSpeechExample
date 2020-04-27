from concurrent import futures
import base64
import time 
import sys
import subprocess

import audioTranscript
sys.path.insert(1, '/grpc')
import transcribe_pb2
import transcribe_pb2_grpc

import grpc

def transcribe(msg):
    # call terminal
    # python3 audioTranscript_cmd.py --aggressive 1 --audio ./audio/guido-van-rossum.wav --model ./models/0.4.1/
    print(msg)
    sys.stdout.flush()
    # test = subprocess.Popen(["python3", "audioTranscript_cmd.py", "--aggressive", "1", "--audio", "/assets/audios/"+msg, "--model", "/models/"], stdout=subprocess.PIPE)
    # output = test.communicate()[0]
    output = transcriptionProcess(1, "/assets/audios/"+msg, "/models/")

    print(output)
    sys.stdout.flush()
    return output

class TService(transcribe_pb2_grpc.TranscribeServiceServicer):
    
    def getTranscription(self, request, context):
        return transcribe_pb2.transcripts(jsonTranscript = transcribe(request.fileRoute))

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=2))
    transcribe_pb2_grpc.add_TranscribeServiceServicer_to_server(TService(),server)
    server.add_insecure_port('[::]:22222')
    server.start()
    try:
        while True:
            time.sleep(60*60*24)
    except KeyboardInterrupt:
        server.stop(0)

if __name__ == '__main__':
    serve()