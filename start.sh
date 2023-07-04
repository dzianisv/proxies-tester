#!/bin/sh

set -eu

if ! command -v node > /dev/null; then
    brew install -y node
fi

if ! command -v npm > /dev/null; then
    brew install -y npm
fi

if [ ! -d node_modules ]; then
    npm install
fi

PROXIES_FILE=proxies.txt

if [  ! -f ${PROXIES_FILE} ]; then
    echo "Getting proxies list: ${PROXIES_FILE}"
    ./node_modules/.bin/proxy-lists getProxies
fi

if [ -f .env ]; then
    export $(< .env)
fi

echo 'Validating proxies, validated proxies will be stored at validated.txt'
node index.js "${PROXIES_FILE}"