FROM node:14
RUN mkdir -p /home/node/ui/node_modules && chown -R node:node /home/node/ui
WORKDIR /home/node/ui
COPY --chown=node:node package.json .
COPY --chown=node:node package-lock.json .
USER node
RUN npm install
COPY --chown=node:node . .
