#!/usr/bin/env bash
# exit on error
set -o errexit

dotenv run uvicorn rapidriter.asgi:application --host 0.0.0.0 --port 8000
