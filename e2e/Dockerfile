# The tag must match the version of @playwright/test in package.json.
ARG PLAYWRIGHT_IMAGE=mcr.microsoft.com/playwright:v1.65.1-noble
FROM $PLAYWRIGHT_IMAGE

# Screenshots depend on the fonts and the rendering of this image, so only
# runs in it compare them with the baselines in tests/visual/.
ENV E2E_VISUAL_TESTS=1

WORKDIR /e2e

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENTRYPOINT ["npx", "playwright", "test"]
