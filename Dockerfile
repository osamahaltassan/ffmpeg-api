FROM ghcr.io/jrottenberg/ffmpeg:8-alpine

# Pin Node.js to version 20.x for reproducibility
RUN apk add --no-cache nodejs~=20 npm

RUN adduser --disabled-password --home /home/ffmpgapi ffmpgapi
WORKDIR /home/ffmpgapi

COPY ./src ./
RUN npm ci --omit=dev

EXPOSE 3000
USER ffmpgapi

# Health check - verify API is responding
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000/endpoints || exit 1

ENTRYPOINT []
CMD ["node", "app.js"]