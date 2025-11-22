#=========== STAGE: BASE =====================================================#

ARG PYTHON_VERSION=3.13-bookworm
FROM python:$PYTHON_VERSION AS base

ENV PYTHONUNBUFFERED=1
ENV DOCKERIZE_VERSION=v0.6.1
ARG BUILD_PG_MAJOR=17
ENV PG_MAJOR=$BUILD_PG_MAJOR

RUN set -eux;

RUN mkdir -p /etc/apt/keyrings;

# Add PostgreSQL signing key and source
RUN curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/keyrings/postgres.gpg && \
    chmod 644 /etc/apt/keyrings/postgres.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/postgres.gpg] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list

# Install common dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    sudo \
    ca-certificates \
    curl \
    gnupg \
    gettext \
    locales \
    rsync \
    && rm -rf /var/lib/apt/lists/*

# Define Locale
RUN localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8
ENV LANG=en_US.utf8

# Install Postgres
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    postgresql-$PG_MAJOR postgresql-client-$PG_MAJOR postgresql-contrib-$PG_MAJOR \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ENV PATH=$PATH:/usr/lib/postgresql/$PG_MAJOR/bin
ENV PGDATA=/var/lib/postgresql/mathesar
ENV MATHESAR_DOCKER_IMAGE='true'

VOLUME /etc/postgresql/
VOLUME /var/lib/postgresql/

EXPOSE 5432

# Mathesar source
WORKDIR /code/


#=========== STAGE: TESTING ==================================================#

ARG PYTHON_VERSION=3.13-bookworm
FROM python:$PYTHON_VERSION AS testing

# Mathesar source
WORKDIR /code/
COPY . .

# Install dev requirements
RUN pip install --no-cache-dir -r requirements-dev.txt

EXPOSE 8000

CMD ["bash", "./bin/mathesar_dev"]


#=========== STAGE: DEVELOPMENT_BASE =========================================#

FROM base AS development_base

COPY . .

ENV NODE_MAJOR=18

# Install dev requirements
RUN pip install --no-cache-dir -r requirements-dev.txt

# Compile translation files
# We set a temporary secret key to avoid mounting a volume during buildtime.
RUN SECRET_KEY=temporary python manage.py compilemessages

# Add NodeJS signing key and source
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    chmod 644 /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" \
    | tee /etc/apt/sources.list.d/nodesource.list

# Install node
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    nodejs \
    && rm -rf /var/lib/apt/lists/*


#=========== STAGE: DEVELOPMENT ==============================================#

FROM development_base AS development

# Install npm packages
RUN cd mathesar_ui && npm ci && cd ..

EXPOSE 8000 3000 6006

CMD ["bash", "./bin/mathesar_dev"]


#=========== STAGE: PRE_PRODUCTION ===========================================#

FROM development_base AS pre_production

RUN python3 ./build-scripts/package/package.py


#=========== STAGE: PRODUCTION ===============================================#

FROM base AS production

# Copy packaged source files
COPY --from=pre_production /code/dist/mathesar.tar.gz ./

RUN tar -xzf mathesar.tar.gz && rm mathesar.tar.gz

# Create directory for media files
RUN mkdir -p .media

# Install prod requirements
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

CMD ["bash", "./bin/mathesar", "run", "-fnse"]
