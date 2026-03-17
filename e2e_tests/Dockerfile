FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /e2e

# Copy package manifests and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy config, framework, app-specific code
COPY tsconfig.json screenwriter.config.ts ./
COPY framework/ ./framework/
COPY mathesar/ ./mathesar/

CMD ["npm", "run", "test"]
