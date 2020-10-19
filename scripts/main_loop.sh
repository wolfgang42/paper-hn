#! /bin/bash


REFRESH_INTERVAL=${REFRESH_INTERVAL:-300}
cd /paper-hn

http-server . >http.log 2>&1 &
echo Starting up... > index.html

while true
do
    node --experimental-modules ./bin/generate-html.mjs    
    sleep $REFRESH_INTERVAL
    rm cache/hn/*.json
done

