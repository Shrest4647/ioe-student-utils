#!/usr/bin/env bash
# Use this script to start a docker container for a local development object storage bucket

# TO RUN ON WINDOWS:
# 1. Install WSL (Windows Subsystem for Linux) - https://learn.microsoft.com/en-us/windows/wsl/install
# 2. Install Docker Desktop or Podman Desktop
# - Docker Desktop for Windows - https://docs.docker.com/docker-for-windows/install/
# - Podman Desktop - https://podman.io/getting-started/installation
# 3. Open WSL - `wsl`
# 4. Run this script - `./start-bucket.sh`

# On Linux and macOS you can run this script directly - `./start-bucket.sh`

# import env variables from .env
set -a
source .env

BUCKET_CONTAINER_NAME="ioe-student-utils-rustfs"
DATA_DIR="${DATA_DIR:-./.rustfs/data}"
LOGS_DIR="${LOGS_DIR:-./.rustfs/logs}"


if ! [ -x "$(command -v docker)" ] && ! [ -x "$(command -v podman)" ]; then
  echo -e "Docker or Podman is not installed. Please install docker or podman and try again.\nDocker install guide: https://docs.docker.com/engine/install/\nPodman install guide: https://podman.io/getting-started/installation"
  exit 1
fi

# determine which docker command to use
if [ -x "$(command -v docker)" ]; then
  DOCKER_CMD="docker"
elif [ -x "$(command -v podman)" ]; then
  DOCKER_CMD="podman"
fi

if ! $DOCKER_CMD info > /dev/null 2>&1; then
  echo "$DOCKER_CMD daemon is not running. Please start $DOCKER_CMD and try again."
  exit 1
fi

# Check if ports 9000 and 9001 are already in use
if command -v nc >/dev/null 2>&1; then
  if nc -z localhost 9000 2>/dev/null; then
    echo "Port 9000 is already in use."
    exit 1
  fi
  if nc -z localhost 9001 2>/dev/null; then
    echo "Port 9001 is already in use."
    exit 1
  fi
else
  echo "Warning: Unable to check if ports 9000 and 9001 are already in use (netcat not installed)"
  read -p "Do you want to continue anyway? [y/N]: " -r REPLY
  if ! [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborting."
    exit 1
  fi
fi

if [ "$($DOCKER_CMD ps -q -f name=$BUCKET_CONTAINER_NAME)" ]; then
  echo "Bucket container '$BUCKET_CONTAINER_NAME' already running"
  exit 0
fi

if [ "$($DOCKER_CMD ps -q -a -f name=$BUCKET_CONTAINER_NAME)" ]; then
  $DOCKER_CMD start "$BUCKET_CONTAINER_NAME"
  echo "Existing bucket container '$BUCKET_CONTAINER_NAME' started"
  exit 0
fi

# Create data directory if it doesn't exist
mkdir -p "$DATA_DIR"
mkdir -p "$LOGS_DIR"

# Change the owner of these directories
# chown -R 10001:10001 "$DATA_DIR" "$LOGS_DIR"


$DOCKER_CMD run -d \
  --name $BUCKET_CONTAINER_NAME \
  -p 9000:9000 \
  -p 9001:9001 \
  -v "$DATA_DIR:/data" \
  -v "$LOGS_DIR:/logs" \
  -e RUSTFS_ACCESS_KEY="rustfsadmin" \
  -e RUSTFS_SECRET_KEY="rustfsadmin" \
  docker.io/rustfs/rustfs:latest && echo "Bucket container '$BUCKET_CONTAINER_NAME' was successfully created"

echo ""
echo "Bucket container started successfully!"
echo "Default credentials: rustfsadmin / rustfsadmin"
echo "Console URL: http://localhost:9001"
echo "API URL: http://localhost:9000"