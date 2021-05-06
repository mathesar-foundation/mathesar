FROM node:14
WORKDIR /ui
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .
