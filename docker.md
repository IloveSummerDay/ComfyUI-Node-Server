### DOCKER MYSQL:LATEST

docker run --name mysql \
-dp 8488:3306 8588:33060 \
--mount type=volume,src=AIpack,target=/var/lib/mysql \
-e MYSQL_ROOT_PASSWORD=800630_mysql \
mysql:latest

### DOCKER NODE:21.2.0 Bridge

docker run -dp 8388:8388 \
--name node \
-w /app \
--mount type=bind,src=/node/server/,target=/app \
--mount type=bind,src=/node/logs,target=/logs \
node:21.2.0 \
/bin/bash -c "npm install && node /app/index.js && npm run dev-pack-local"

### DOCKER NODE:21.2.0 HOST

docker run -d \
--name node \
--network host \
-w /app \
--mount type=bind,src=/node/server/,target=/app \
--mount type=bind,src=/node/logs,target=/logs \
node:21.2.0 \
/bin/bash -c "npm install && node /app/index.js && npm run dev-pack-local"

### test

http://101.37.30.39:8388/test
/bin/bash -c "npm install "
/bin/bash -c "npm install && node /app/index.js"

docker run -d --name mysql \
--network container:node \
--mount type=volume,src=AIpack,target=/var/lib/mysql \
-e MYSQL_ROOT_PASSWORD=800630_mysql \
mysql:latest
