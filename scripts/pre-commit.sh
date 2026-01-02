#!/bin/bash
set -e
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")

cd "${SCRIPT_DIR}/.."

npm run format
npm run lint
npm run build

echo "complete!"
