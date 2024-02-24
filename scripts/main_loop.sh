#! /bin/bash


REFRESH_INTERVAL=${REFRESH_INTERVAL:-3600}

nginx
echo Generating index.html .. > index.html

while true
do
    echo "-------------------------------------------"
    echo "Start: $(date)"
    node --trace-warnings --experimental-modules ./bin/generate-html.mjs --hacker-news=hn 2>&1
    echo "Done: $(date)"
    sleep $REFRESH_INTERVAL

    mkdir -p /home/user/cache/hn2
    rm -rf /home/user/cache/hn2
    echo "-------------------------------------------"
    echo "Start: $(date)"

    node --trace-warnings --experimental-modules ./bin/generate-html.mjs --hacker-news=hn2 2>&1
    rm -rf /home/user/cache/hn
    echo "Done: $(date)"
    sleep $REFRESH_INTERVAL
done

