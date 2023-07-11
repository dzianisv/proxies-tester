#!/bin/bash
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
# This command uses the sort utility with the following options:
# -n performs a numeric sort.
# -k2 specifies the field to sort by. In this case, it's the second field (server speed).
# -t' ' sets the field delimiter to a space.
sort -nr -k2 -t' ' proxies-formated.txt -o proxies-formated.txt
# use validated proxies next time
cp proxies-new.txt proxies.txt


