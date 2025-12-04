FROM ghcr.io/jrottenberg/ffmpeg:8-alpine

RUN apk add --no-cache nodejs npm

RUN adduser --disabled-password --home /home/ffmpgapi ffmpgapi
WORKDIR /home/ffmpgapi

COPY ./src ./
RUN npm ci --omit=dev

EXPOSE 3000
USER ffmpgapi

ENTRYPOINT []
CMD ["node", "app.js"]