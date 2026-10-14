ARG PYTHON_VERSION=3.14-bookworm

#=========== BASE STAGES =====================================================#

##---------- Python and essential packages -----------------------------------#

FROM python:$PYTHON_VERSION AS base

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

ENV MATHESAR_DOCKER_IMAGE='true'
ENV PYTHONUNBUFFERED=1

### Define Locale
RUN localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8
ENV LANG=en_US.utf8

WORKDIR /code/


##---------- Base with code and build time deps ------------------------------#

FROM base AS build_deps

COPY . .

ENV NODE_MAJOR=18

### Install dev requirements
RUN pip install --no-cache-dir -r requirements-dev.txt

### Compile translation files
### We set a temporary secret key to avoid mounting a volume during buildtime.
RUN SECRET_KEY=temporary python manage.py compilemessages

### Add NodeJS signing key and source
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    chmod 644 /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" \
    | tee /etc/apt/sources.list.d/nodesource.list

### Install node
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    nodejs \
    && rm -rf /var/lib/apt/lists/*


#=========== DEV RELATED STAGES ==============================================#

##---------- Testing stage ---------------------------------------------------#

FROM base AS testing

COPY . .

RUN pip install --no-cache-dir -r requirements-dev.txt

EXPOSE 8000

CMD ["bash", "./bin/mathesar_dev"]


##---------- Development stage -----------------------------------------------#

FROM build_deps AS development

RUN cd mathesar_ui && npm ci && cd ..

EXPOSE 8000 3000 6006

CMD ["bash", "./bin/mathesar_dev"]


#=========== PRODUCTION STAGES ===============================================#

##---------- Pre-production packaging ----------------------------------------#

FROM build_deps AS pre_production

## Packages source files
RUN python3 ./build-scripts/package/package.py


##---------- Production base -------------------------------------------------#

FROM base AS production_base

### Copy packaged source files
COPY --from=pre_production /code/dist/mathesar.tar.gz ./

RUN tar -xzf mathesar.tar.gz && rm mathesar.tar.gz

RUN mkdir -p .media

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000


##---------- Minimal prod setup ----------------------------------------------#

FROM production_base AS minimal

ENV DJANGO_SETTINGS_MODULE=config.settings.production
# Collect admin static assets so opt-in runtime admin has complete styling.
RUN SECRET_KEY=temporary MATHESAR_DJANGO_ADMIN_ENABLED=true python manage.py collectstatic --noinput
ENV SKIP_STATIC_COLLECTION=true

RUN groupadd --system --gid 1000 mathesar \
    && useradd  --system --uid 1000 --gid 1000 --shell /usr/sbin/nologin mathesar \
    && chown -R 1000:1000 /code
USER 1000:1000

### Do not include flags for Django setup and inbuilt db fallback
CMD ["bash", "./bin/mathesar", "run", "-ne"]


##---------- Prod setup ------------------------------------------------------#

FROM production_base AS production

ARG BUILD_PG_MAJOR=17
ENV PG_MAJOR=$BUILD_PG_MAJOR

RUN mkdir -p /etc/apt/keyrings;

### Add PostgreSQL signing key and source
RUN curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/keyrings/postgres.gpg && \
    chmod 644 /etc/apt/keyrings/postgres.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/postgres.gpg] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list

### Install Postgres
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    postgresql-$PG_MAJOR postgresql-client-$PG_MAJOR postgresql-contrib-$PG_MAJOR \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ENV PATH=$PATH:/usr/lib/postgresql/$PG_MAJOR/bin
ENV PGDATA=/var/lib/postgresql/mathesar

VOLUME /etc/postgresql/
VOLUME /var/lib/postgresql/

EXPOSE 5432

CMD ["bash", "./bin/mathesar", "run", "-fnse"]
