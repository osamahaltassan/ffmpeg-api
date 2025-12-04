# FFMPEG API

A RESTful web service for converting audio, video, and image files using FFMPEG.

## Table of Contents

- [Overview](https://claude.ai/chat/69dbf18a-7fa0-4e28-9f74-cda9b02e013c#overview)
- [Quick Start](https://claude.ai/chat/69dbf18a-7fa0-4e28-9f74-cda9b02e013c#quick-start)
- [API Endpoints](https://claude.ai/chat/69dbf18a-7fa0-4e28-9f74-cda9b02e013c#api-endpoints)
- [Docker](https://claude.ai/chat/69dbf18a-7fa0-4e28-9f74-cda9b02e013c#docker)
- [Usage Examples](https://claude.ai/chat/69dbf18a-7fa0-4e28-9f74-cda9b02e013c#usage-examples)
- [Supported Formats](https://claude.ai/chat/69dbf18a-7fa0-4e28-9f74-cda9b02e013c#supported-formats)
- [Troubleshooting](https://claude.ai/chat/69dbf18a-7fa0-4e28-9f74-cda9b02e013c#troubleshooting)

## Overview

FFMPEG API provides a simple HTTP interface for media file operations:

- **Convert** audio/video/image files between formats
- **Extract** audio tracks or image frames from video
- **Probe** media files for metadata

Based on:

- [samisalkosuo/ffmpeg-api](https://github.com/samisalkosuo/ffmpeg-api)
- [surebert/docker-ffmpeg-service](https://github.com/surebert/docker-ffmpeg-service)
- [jrottenberg/ffmpeg](https://github.com/jrottenberg/ffmpeg)
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)

## Quick Start

```bash
# Run the container
docker run -d --name ffmpeg-api -p 3000:3000 ghcr.io/osamahaltassan/ffmpeg-api:1.1

# Convert a file
curl -F "file=@input.wav" http://localhost:3000/convert/audio/to/mp3 > output.mp3
```

## API Endpoints

### General

|Endpoint|Description|
|---|---|
|`GET /`|API documentation|
|`GET /endpoints`|List all endpoints as JSON|

### Convert

|Endpoint|Description|
|---|---|
|`POST /convert/audio/to/mp3`|Convert audio file to MP3|
|`POST /convert/audio/to/wav`|Convert audio file to WAV|
|`POST /convert/video/to/mp4`|Convert video file to MP4|
|`POST /convert/image/to/jpg`|Convert image file to JPG|

### Extract

|Endpoint|Description|Query Parameters|
|---|---|---|
|`POST /video/extract/audio`|Extract audio track from video as WAV|`mono=no` - Keep all channels (default: mono)|
|`POST /video/extract/images`|Extract frames from video as PNG|`fps=N` - Frames per second (default: 1)<br>`compress=zip\|gzip` - Return compressed archive|
|`GET /video/extract/download/:filename`|Download extracted image|`delete=no` - Keep file on server|

### Probe

|Endpoint|Description|
|---|---|
|`POST /probe`|Return media file metadata as JSON (same as `ffprobe -of json -show_streams -show_format`)|

## Docker

### Using Pre-built Image

```bash
# Foreground (interactive)
docker run -it --rm --name ffmpeg-api -p 3000:3000 ghcr.io/osamahaltassan/ffmpeg-api:1.1

# Background (detached)
docker run -d --name ffmpeg-api -p 3000:3000 ghcr.io/osamahaltassan/ffmpeg-api:1.1
```

### Building From Source

```bash
git clone https://github.com/osamahaltassan/ffmpeg-api.git
cd ffmpeg-api
docker build -t ffmpeg-api .
docker run -d --name ffmpeg-api -p 3000:3000 ffmpeg-api
```

### Environment Variables

| Variable                | Default             | Description                                            |
| ----------------------- | ------------------- | ------------------------------------------------------ |
| `LOG_LEVEL`             | `info`              | Logging verbosity: `debug`, `info`, `warn`, `error`    |
| `FILE_SIZE_LIMIT_BYTES` | `536870912` (512MB) | Maximum upload file size in bytes                      |
| `KEEP_ALL_FILES`        | `false`             | Keep all files in `/tmp` (useful for debugging)        |
| `EXTERNAL_PORT`         | `3000`              | Port shown in returned URLs (for reverse proxy setups) |

### Volume Mounts

#### Temporary Storage (Recommended for Large Files)

The container uses `/tmp` for processing files. For large media files, mount a host directory with sufficient space:

```bash
docker run -d --name ffmpeg-api \
  -p 3000:3000 \
  -v /path/to/large/storage:/tmp \
  ghcr.io/osamahaltassan/ffmpeg-api:1.1
```

> **Tip:** Ensure the mounted directory has enough space for both the uploaded file and the converted output (2x the file size as a safe estimate).

### Docker Compose Example

```yaml
version: '3.8'

services:
  ffmpeg-api:
    image: ghcr.io/osamahaltassan/ffmpeg-api:1.1
    container_name: ffmpeg-api
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - LOG_LEVEL=info
      - FILE_SIZE_LIMIT_BYTES=2147483648  # 2GB
      - KEEP_ALL_FILES=false
    volumes:
      - /data/ffmpeg-tmp:/tmp
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/endpoints"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Usage Examples

### Audio Conversion

```bash
# WAV to MP3
curl -F "file=@input.wav" http://localhost:3000/convert/audio/to/mp3 > output.mp3

# M4A to WAV
curl -F "file=@input.m4a" http://localhost:3000/convert/audio/to/wav > output.wav
```

### Video Conversion

```bash
# MOV to MP4
curl -F "file=@input.mov" http://localhost:3000/convert/video/to/mp4 > output.mp4

# Any video to MP4
curl -F "file=@input.mkv" http://localhost:3000/convert/video/to/mp4 > output.mp4
```

### Image Conversion

```bash
# PNG to JPG
curl -F "file=@input.png" http://localhost:3000/convert/image/to/jpg > output.jpg

# TIFF to JPG
curl -F "file=@input.tiff" http://localhost:3000/convert/image/to/jpg > output.jpg
```

### Extract Audio from Video

```bash
# Extract mono audio (default)
curl -F "file=@video.mp4" http://localhost:3000/video/extract/audio > audio.wav

# Extract stereo audio
curl -F "file=@video.mp4" "http://localhost:3000/video/extract/audio?mono=no" > audio.wav
```

### Extract Images from Video

```bash
# Extract at 1 FPS (default) - returns JSON with download URLs
curl -F "file=@video.mp4" http://localhost:3000/video/extract/images

# Extract at 0.5 FPS (one frame every 2 seconds)
curl -F "file=@video.mp4" "http://localhost:3000/video/extract/images?fps=0.5"

# Extract at 4 FPS and get as ZIP
curl -F "file=@video.mp4" "http://localhost:3000/video/extract/images?fps=4&compress=zip" > frames.zip

# Extract and get as tar.gz
curl -F "file=@video.mp4" "http://localhost:3000/video/extract/images?compress=gzip" > frames.tar.gz

# Download individual extracted frame
curl http://localhost:3000/video/extract/download/abc123-0001.png > frame.png

# Download without deleting from server
curl "http://localhost:3000/video/extract/download/abc123-0001.png?delete=no" > frame.png
```

### Probe Media Metadata

```bash
# Get media file information
curl -F "file=@video.mp4" http://localhost:3000/probe | jq .

# Example output includes: codec, resolution, duration, bitrate, etc.
```

## Supported Formats

This API supports all formats that FFMPEG supports. See the [official FFMPEG documentation](https://www.ffmpeg.org/general.html#Supported-File-Formats_002c-Codecs-or-Features) for a complete list.

Common supported formats:

- **Audio**: MP3, WAV, AAC, FLAC, OGG, M4A, WMA
- **Video**: MP4, MKV, AVI, MOV, WebM, FLV, WMV
- **Image**: JPG, PNG, GIF, TIFF, BMP, WebP

## Troubleshooting

### Out of Space Errors

If you encounter space-related errors when processing large files:

1. Mount a volume with sufficient space to `/tmp`
2. Increase Docker's disk allocation
3. Check available space: `docker exec ffmpeg-api df -h /tmp`

### Timeout Errors

For large files that take long to process:

- Increase your HTTP client timeout
- Consider using async processing for very large files

### Debug Mode

Enable debug logging to see detailed processing information:

```bash
docker run -e LOG_LEVEL=debug -p 3000:3000 ghcr.io/osamahaltassan/ffmpeg-api:1.1
```
