#! /bin/bash


REFRESH_INTERVAL=${REFRESH_INTERVAL:-300}

http-server . >http.log 2>&1 &
echo Starting up... > index.html

while true
do
    node --trace-warnings --experimental-modules ./bin/generate-html.mjs
    sleep $REFRESH_INTERVAL

    find cache/ -name "*.json" -type f -delete
done

