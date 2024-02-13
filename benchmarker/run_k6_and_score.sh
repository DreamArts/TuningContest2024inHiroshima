#!/bin/bash

# ==================================
# 負荷試験・採点スクリプト。
# ==================================

if [[ $HOSTNAME == env-* ]];
then
	BASE_URL="https://${HOSTNAME}.ftt2306.dabaas.net"
else
	BASE_URL="http://host.docker.internal"
fi

if [ $1 ];
then
    FILE_NAME=$1
else
    FILE_NAME=`date "+%Y%m%d_%H%M%S"`
fi

COMMIT=`git show | head -1 | awk '{print $2}'`

# 負荷試験開始
echo "負荷試験を開始します。"

mkdir -p logs
mkdir -p score

DOCKER_BUILDKIT=1 docker build -f Dockerfile.k6 -t k6 . && \
if [ $GITHUB_ACTIONS ];
then
    docker run --rm --add-host=host.docker.internal:host-gateway \
     -v $(pwd)/logs:/logs \
     --user $UID \
     k6 run --out json=/logs/${FILE_NAME}.json -e BASE_URL=${BASE_URL} /k6/dist/loadTest.js
else
    docker run -it --rm --add-host=host.docker.internal:host-gateway \
     -v $(pwd)/logs:/logs \
     --user $UID \
     k6 run --out json=/logs/${FILE_NAME}.json -e BASE_URL=${BASE_URL} /k6/dist/loadTest.js
fi

if [ $? -ne 0 ]; then
    echo "Failed to perform a benchmark"
    echo "{\"commit\": \"$COMMIT\", \"pass\": false, \"score\": 0, \"success\": 0, \"fail\": 0}" > ./score/${FILE_NAME}.json
    exit 1
else
    # 採点開始
    echo -e "\n負荷試験に成功しました. スコアを計算中...\n"
    DOCKER_BUILDKIT=1 docker build -f Dockerfile.scoring -t scoring . && \
    docker run --rm \
    -v $(pwd)/logs:/scoring/logs \
    -v $(pwd)/score:/scoring/score \
    -e COMMIT=${COMMIT} scoring node /scoring/dist/resultParser.js /scoring/logs/${FILE_NAME}.json
fi

if [ $? -ne 0 ]; then
    echo "スコアの計算に失敗しました。"
    exit 1
fi
