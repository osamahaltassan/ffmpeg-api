#####################################################################
#
# A Docker image to convert audio and video for web using web API
#
#   with
#     - FFMPEG (latest stable)
#     - NodeJS (LTS)
#     - fluent-ffmpeg
#
#   For more on Fluent-FFMPEG, see 
#
#            https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
#
#####################################################################

FROM node:20-alpine3.21 AS build

# Install dependencies with no cache to reduce layer size
RUN apk add --no-cache git

# Use maintained pkg fork
RUN npm install -g @yao-pkg/pkg

ENV PKG_CACHE_PATH=/usr/cache

WORKDIR /usr/src/app

# Copy package files first for better layer caching
COPY ./src/package*.json ./

# Install with clean install for reproducible builds
RUN npm ci --only=production

# Copy source code
COPY ./src .

# Create single binary file
RUN pkg --targets node20-alpine-x64 --output ffmpegapi .


FROM jrottenberg/ffmpeg:8-alpine

# Security labels
LABEL maintainer="your-email@example.com" \
      description="FFmpeg API service" \
      version="2.0"

# Create non-root user with specific UID/GID for consistency
RUN addgroup -g 1000 ffmpgapi && \
    adduser -D -u 1000 -G ffmpgapi -h /home/ffmpgapi ffmpgapi

WORKDIR /home/ffmpgapi

# Copy artifacts from build stage
COPY --from=build --chown=ffmpgapi:ffmpgapi /usr/src/app/ffmpegapi .
COPY --from=build --chown=ffmpgapi:ffmpgapi /usr/src/app/index.md .

# Make binary executable
RUN chmod 755 ffmpegapi

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Switch to non-root user
USER ffmpgapi

# Use exec form for proper signal handling
CMD ["./ffmpegapi"]