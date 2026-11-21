# The tag must match the version of @playwright/test in package.json.
ARG PLAYWRIGHT_IMAGE=mcr.microsoft.com/playwright:v1.65.1-noble
FROM $PLAYWRIGHT_IMAGE

WORKDIR /e2e

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENTRYPOINT ["npx", "playwright", "test"]
