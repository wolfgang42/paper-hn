#! /bin/bash

cd /paper-hn

http-server . >http.log 2>&1 &
echo Starting up... > index.html

while true
do
    node --experimental-modules ./bin/generate-html.mjs    
    sleep 300
    rm cache/hn/*.json
done

