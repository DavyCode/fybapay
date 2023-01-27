FROM node:18-bullseye-slim

WORKDIR /usr/apps

COPY ./package.json .

RUN npm install

COPY . .

# RUN npm run deploy

CMD [ "npm", "run", "start" ]