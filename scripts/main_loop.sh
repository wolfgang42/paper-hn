#! /bin/bash


REFRESH_INTERVAL=${REFRESH_INTERVAL:-300}

nginx
echo Building content.. > index.html

while true
do
    node --trace-warnings --experimental-modules ./bin/generate-html.mjs
    sleep $REFRESH_INTERVAL
done

