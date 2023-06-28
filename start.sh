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

if [  ! -f proxies.txt ]; then
    echo 'Getting proxies list: proxies.txt'
    ./node_modules/.bin/proxy-lists getProxies
fi

echo 'Validating proxies, validated proxies will be stored at validated.txt'
node index.js proxies.txt