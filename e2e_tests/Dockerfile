FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /e2e

# Copy package manifests and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy config files (test source files are mounted at runtime)
COPY tsconfig.json playwright.config.ts ./

CMD ["npx", "playwright", "test"]
