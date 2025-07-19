#!/bin/bash

echo "Starting Flask Emotion Analysis Service..."
echo

# Change to script directory
cd "$(dirname "$0")"

echo "Checking Python installation..."
python3 --version
if [ $? -ne 0 ]; then
    echo "Error: Python3 is not installed or not in PATH"
    exit 1
fi

echo
echo "Installing/updating dependencies..."
pip3 install -r requirements.txt

echo
echo "Starting Flask app..."
python3 start_flask.py 