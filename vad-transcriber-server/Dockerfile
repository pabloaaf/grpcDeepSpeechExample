FROM ubuntu:19.10
RUN apt-get update
RUN apt-get install sox -y

RUN apt-get install python3 -y
RUN apt-get install python3-pip -y
RUN apt-get install wget -y

RUN pip3 install grpcio
RUN pip3 install grpcio-tools
RUN pip3 install deepspeech
RUN pip3 install webrtcvad
RUN pip3 install pyqt5==5.14.0

WORKDIR /models
RUN wget https://github.com/mozilla/DeepSpeech/releases/download/v0.7.0/deepspeech-0.7.0-models.pbmm
RUN wget https://github.com/mozilla/DeepSpeech/releases/download/v0.7.0/deepspeech-0.7.0-models.scorer

WORKDIR /grcp
COPY ./transcribe.proto /grcp
RUN python3 -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. transcribe.proto

WORKDIR /app





