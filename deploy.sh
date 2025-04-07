#!/bin/bash
set -e
APP_PORT=6112
APP_ROOT=/opt/apps/link-deck
UI_ROOT=$APP_ROOT/ui
BINARY_NAME=link-deck

mkdir -p $APP_ROOT
mkdir -p $UI_ROOT

echo "Starting deployment process..."

# Step 1: Build the application
echo "Building application..."
# bash build.sh


# stop any running instance of the application
if pgrep -f $BINARY_NAME > /dev/null; then
  echo "Stopping existing instance of $BINARY_NAME..."
  pkill -f $BINARY_NAME
fi
# Step 2: Move the binary to the application root
echo "Moving binary to $APP_ROOT..."
LOCAL_BINARY_PATH="./bin/${BINARY_NAME}"

cp $LOCAL_BINARY_PATH $APP_ROOT/$BINARY_NAME
chmod +x $APP_ROOT/$BINARY_NAME
echo "Application built and moved to $APP_ROOT/$BINARY_NAME"

cp -r ./ui/dist $UI_ROOT/

cd $APP_ROOT

$APP_ROOT/$BINARY_NAME --config $APP_ROOT/config.json