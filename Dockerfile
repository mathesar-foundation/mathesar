FROM python:3.9-buster
ARG PYTHON_REQUIREMENTS=requirements.txt
ENV PYTHONUNBUFFERED=1
ENV DOCKERIZE_VERSION v0.6.1
ENV NODE_MAJOR 18
ARG BUILD_PG_MAJOR=15
ENV PG_MAJOR=$BUILD_PG_MAJOR

# Install dependencies
RUN apt-get update
RUN apt-get install -y sudo ca-certificates curl gnupg
RUN set -eux; \
	apt-get update; apt-get install -y --no-install-recommends locales; rm -rf /var/lib/apt/lists/*; \
	localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8

# Install PostgreSQL
ENV LANG en_US.utf8
RUN set -ex; \
    curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - ; \
    echo "deb http://apt.postgresql.org/pub/repos/apt/ buster-pgdg main" > /etc/apt/sources.list.d/pgdg.list; \
    apt-get update -y; \
     apt-get install -y --no-install-recommends \
        postgresql-$PG_MAJOR postgresql-client-$PG_MAJOR postgresql-contrib-$PG_MAJOR \
    ; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*; \
    :

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

# Install dockerize, we still need it when running Postgres using docker-compose
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# Install Node
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update
RUN apt-get install nodejs -y

# Change work directory
WORKDIR /code/

# Copy all the requirements
COPY requirements* ./
RUN pip install --no-cache-dir -r ${PYTHON_REQUIREMENTS} --force-reinstall sqlalchemy-filters
COPY . .

RUN cd mathesar_ui && npm ci && npm run build
EXPOSE 8000 3000 6006
ENTRYPOINT ["./run.sh"]