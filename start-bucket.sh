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

set -e

# -----------------------------
# Flags
# -----------------------------
TS_SERVE=false
S3_PORT=9000
S3_CONSOLE_PORT=9001

for arg in "$@"; do
  case $arg in
    --ts-serve)
      TS_SERVE=true
      ;;
    --s3-port=*)
      S3_PORT="${arg#*=}"
      ;;
    --s3-console-port=*)
      S3_CONSOLE_PORT="${arg#*=}"
      ;;
    *)
      echo "Unknown option: $arg"
      exit 1
      ;;
  esac
done

# Add 10000 to the ports to avoid conflicts with the default ports
HTTP_S3_PORT=$((S3_PORT + 10000))
HTTP_S3_CONSOLE_PORT=$((S3_CONSOLE_PORT + 10000))

# -----------------------------
# Validate ports
# -----------------------------
validate_port() {
  if ! [[ "$1" =~ ^[0-9]+$ ]] || [ "$1" -lt 1 ] || [ "$1" -gt 65535 ]; then
    echo "Invalid port: $1."
  fi
}

validate_port "$S3_PORT"
validate_port "$S3_CONSOLE_PORT"
validate_port "$HTTP_S3_PORT"
validate_port "$HTTP_S3_CONSOLE_PORT"

# -----------------------------
# Load env
# -----------------------------
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

BUCKET_CONTAINER_NAME="hawaii-s3-container"
DATA_DIR="${DATA_DIR:-./.rustfs/data}"
LOGS_DIR="${LOGS_DIR:-./.rustfs/logs}"

# -----------------------------
# Check docker/podman
# -----------------------------
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

# -----------------------------
# Port checks
# -----------------------------
if command -v nc >/dev/null 2>&1; then
  if nc -z localhost "$S3_PORT" 2>/dev/null; then
    echo "Port $S3_PORT is already in use."
    exit 1
  fi
  if nc -z localhost "$S3_CONSOLE_PORT" 2>/dev/null; then
    echo "Port $S3_CONSOLE_PORT is already in use."
    exit 1
  fi
  if nc -z localhost "$HTTP_S3_PORT" 2>/dev/null; then
    echo "Port $HTTP_S3_PORT is already in use."
    exit 1
  fi
  if nc -z localhost "$HTTP_S3_CONSOLE_PORT" 2>/dev/null; then
    echo "Port  19001 is already in use."
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


# -----------------------------
# Start container
# -----------------------------
if [ "$($DOCKER_CMD ps -q -f name=$BUCKET_CONTAINER_NAME)" ]; then
  echo "Container already running"
else
  if [ "$($DOCKER_CMD ps -q -a -f name=$BUCKET_CONTAINER_NAME)" ]; then
    $DOCKER_CMD start "$BUCKET_CONTAINER_NAME"
    echo "Existing container started"
  else
    mkdir -p "$DATA_DIR" "$LOGS_DIR"
    chown -R 10001:10001 "$DATA_DIR" "$LOGS_DIR"

    $DOCKER_CMD run -d \
      --name $BUCKET_CONTAINER_NAME \
      -p "127.0.0.1:$HTTP_S3_PORT:9000" \
      -p "127.0.0.1:$HTTP_S3_CONSOLE_PORT:9001" \
      -v "$DATA_DIR:/data" \
      -v "$LOGS_DIR:/logs" \
      -e RUSTFS_ACCESS_KEY="$RUSTFS_ACCESS_KEY" \
      -e RUSTFS_SECRET_KEY="$RUSTFS_SECRET_KEY" \
      docker.io/rustfs/rustfs:latest

    echo "Container created"
  fi
fi

# -----------------------------
# Output local access
# -----------------------------
echo ""
echo "Local access:"
echo "  S3 API:     http://localhost:$HTTP_S3_PORT"
echo "  Console:    http://localhost:$HTTP_S3_CONSOLE_PORT"

# -----------------------------
# Tailscale Serve
# -----------------------------
if [ "$TS_SERVE" = true ]; then
  echo ""
  echo "Configuring Tailscale Serve..."

  if ! command -v tailscale >/dev/null 2>&1; then
    echo "Tailscale is not installed."
    exit 1
  fi

  if ! tailscale status >/dev/null 2>&1; then
    echo "Tailscale is not connected. Run: tailscale up"
    exit 1
  fi

  # Reset existing serve config (optional but safer)
  tailscale serve --https=$S3_PORT off || true
  tailscale serve --https=$S3_CONSOLE_PORT off || true

  # Root → S3 API (important for S3 compatibility)
  tailscale serve --bg --https=$S3_PORT "127.0.0.1:1$S3_PORT"

  # Console UI
  tailscale serve --bg --https=$S3_CONSOLE_PORT "127.0.0.1:1$S3_CONSOLE_PORT"

  TS_DOMAIN=$(tailscale status --json | jq -r '.Self.DNSName')

  echo ""
  echo "Tailscale access:"
  echo "  S3 API:     https://$TS_DOMAIN:$S3_PORT/"
  echo "  Console:    https://$TS_DOMAIN:$S3_CONSOLE_PORT/"
  echo "Tailscale serve status"
  tailscale serve status
fi

echo ""
echo "✅ Bucket ready!"