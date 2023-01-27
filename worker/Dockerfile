FROM node:16.19.0-bullseye-slim

WORKDIR /usr/apps

COPY ./package.json .

RUN npm install

COPY . .

CMD [ "npm", "run", "start" ]