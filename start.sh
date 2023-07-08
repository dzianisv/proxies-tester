#!/bin/sh
set -eu

if [ $(uname) == "Darwin" ]; then
    STAT="stat -f %m"
else
    STAT="stat --format %Y"
fi

if ! command -v npm > /dev/null || ! command -v node > /dev/null; then
    if command -v brew; then
        brew install -y node npm
    else
        sudo apt install -y nodejs npm
    fi
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

if [ -f proxies-formated.txt ]; then
    echo 'Backing up proxies-formated.txt'
    mv proxies-formated.txt proxies-formated-$($STAT ./proxies-formated.txt).txt
fi

echo 'Validating proxies...'
node index.js "${PROXIES_FILE}"
# use validated proxies next time
cp proxies-new.txt proxies.txt
