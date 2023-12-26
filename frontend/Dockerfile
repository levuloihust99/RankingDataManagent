FROM node:16.20.2-buster-slim

WORKDIR /app

COPY . .

RUN npm i

ENTRYPOINT PORT=$FRONTEND_PORT npm start