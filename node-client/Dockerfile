FROM jrottenberg/ffmpeg:4.1-alpine AS ffmpeg

FROM node:12.10.0-alpine

COPY --from=ffmpeg / /

WORKDIR /app
COPY ./package* /app/
RUN npm install
COPY . /app
