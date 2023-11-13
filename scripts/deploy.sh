#!/bin/bash

CONTAINER="app_container"
IMAGE="app_image"

if docker container inspect "$CONTAINER" >/dev/null 2>&1; then
    echo "container exists locally"
    docker stop "$CONTAINER"
    docker rm "$CONTAINER"
else
    echo "container does not exist locally"
fi
if docker image inspect "$IMAGE" >/dev/null 2>&1; then
    echo "Image exists locally"
    docker rmi "$IMAGE"
else
    echo "Image does not exist locally"
fi

docker build -t "$IMAGE" .
 docker run -i --init --rm --cap-add=SYS_ADMIN \
   --name "$CONTAINER" "$IMAGE" \
   -dp 80:3000 \
   npm run start


# docker run -dp 80:3000 --name "$CONTAINER" "$IMAGE"