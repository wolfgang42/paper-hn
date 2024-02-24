#! /bin/bash


REFRESH_INTERVAL=${REFRESH_INTERVAL:-3600}

nginx

while true
do
    echo "-------------------------------------------"
    echo Generating index.html .. > index.html
    node --trace-warnings --experimental-modules ./bin/generate-html.mjs --hacker-news=hn
    echo "Done."
    sleep $REFRESH_INTERVAL

    mkdir -p /home/user/cache/hn2
    rm -rf /home/user/cache/hn2
    echo "-------------------------------------------"

    echo Generating index.html .. > index.html
    node --trace-warnings --experimental-modules ./bin/generate-html.mjs --hacker-news=hn2
    rm -rf /home/user/cache/hn
    echo "Done."
    sleep $REFRESH_INTERVAL
done

