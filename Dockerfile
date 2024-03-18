#=========== STAGE: BASE =====================================================#
ARG PYTHON_VERSION=3.9-bookworm
FROM python:$PYTHON_VERSION AS base

ENV PYTHONUNBUFFERED=1
ENV DOCKERIZE_VERSION v0.6.1
ARG BUILD_PG_MAJOR=15
ENV PG_MAJOR=$BUILD_PG_MAJOR

RUN set -eux;

RUN mkdir -p /etc/apt/keyrings;

# Add Postgres source
RUN curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - ; \
    echo "deb http://apt.postgresql.org/pub/repos/apt/ bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list;

# Install common dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        sudo \
        ca-certificates \
        curl \
        gnupg \
        gettext \
        locales \
    && rm -rf /var/lib/apt/lists/*

# Define Locale
RUN localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8
ENV LANG en_US.utf8

# Install Postgres
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        postgresql-$PG_MAJOR postgresql-client-$PG_MAJOR postgresql-contrib-$PG_MAJOR \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ENV PATH $PATH:/usr/lib/postgresql/$PG_MAJOR/bin
ENV PGDATA /var/lib/postgresql/mathesar

VOLUME /etc/postgresql/
VOLUME /var/lib/postgresql/

# We set the default STOPSIGNAL to SIGINT, which corresponds to what PostgreSQL
# calls "Fast Shutdown mode" wherein new connections are disallowed and any
# in-progress transactions are aborted, allowing PostgreSQL to stop cleanly and
# flush tables to disk, which is the best compromise available to avoid data
# corruption.

STOPSIGNAL SIGINT

EXPOSE 5432

# Mathesar source
WORKDIR /code/
COPY . .


#=========== STAGE: DEVELOPMENT ==============================================#

FROM base AS development

ENV NODE_MAJOR 18

# Install dev requirements
RUN pip install --no-cache-dir -r requirements-dev.txt

# Compile translation files
RUN python manage.py compilemessages

# Add NodeJS source
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg; \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list;

# Install node
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        nodejs \
    && rm -rf /var/lib/apt/lists/*

# Build frontend source
RUN cd mathesar_ui && npm ci && npm run build

EXPOSE 8000 3000 6006

ENTRYPOINT ["./dev-run.sh"]


#=========== STAGE: PRODUCTION ===============================================#

FROM base AS production

# Install prod requirements
RUN pip install --no-cache-dir -r requirements-prod.txt

# Compile translation files
RUN python manage.py compilemessages

# Copy built frontend static files
COPY --from=development /code/mathesar/static/mathesar ./mathesar/static/mathesar/

# Remove FE source, tests, docs
RUN rm -rf ./mathesar_ui
RUN rm -rf ./mathesar/tests ./db/tests
RUN rm -rf ./docs

EXPOSE 8000

ENTRYPOINT ["./run.sh"]
