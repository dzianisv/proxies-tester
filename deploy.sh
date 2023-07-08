#!/bin/sh
set -eu

HOST=${1:-user@orangepi4-lts}
rsync --progress -rtl --exclude=node_modules .env * $HOST:~/.local/lib/proxy-validator/
ssh $HOST '~/.local/bin/proxy-validator/install-service.sh'
