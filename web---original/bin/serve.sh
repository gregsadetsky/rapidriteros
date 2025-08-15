#!/usr/bin/env bash
# exit on error
set -o errexit

uvicorn --host 0.0.0.0 --port 8000 --access-log --no-use-colors rapidriter.asgi:application
