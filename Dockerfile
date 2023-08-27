FROM python:3.9-buster
ARG PYTHON_REQUIREMENTS=requirements.txt
ENV PYTHONUNBUFFERED=1
ENV DOCKERIZE_VERSION v0.6.1

ENV PG_MAJOR 13

RUN set -ex; \
    curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - ; \
    echo "deb http://apt.postgresql.org/pub/repos/apt/ buster-pgdg main" > /etc/apt/sources.list.d/pgdg.list; \
    apt-get update -y; \
     apt-get install -y --no-install-recommends \
        postgresql-15 postgresql-client-15 postgresql-contrib-15 \
    ; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*; \
    :

ENV PATH $PATH:/usr/lib/postgresql/$PG_MAJOR/bin

ENV PGDATA /var/lib/postgresql/mathesar
VOLUME /etc/postgres/15/mathesar
VOLUME /var/lib/postgresql/mathesar


# We set the default STOPSIGNAL to SIGINT, which corresponds to what PostgreSQL
# calls "Fast Shutdown mode" wherein new connections are disallowed and any
# in-progress transactions are aborted, allowing PostgreSQL to stop cleanly and
# flush tables to disk, which is the best compromise available to avoid data
# corruption.
#
# Users who know their applications do not keep open long-lived idle connections
# may way to use a value of SIGTERM instead, which corresponds to "Smart
# Shutdown mode" in which any existing sessions are allowed to finish and the
# server stops when all sessions are terminated.
#
# See https://www.postgresql.org/docs/12/server-shutdown.html for more details
# about available PostgreSQL server shutdown signals.
#
# See also https://www.postgresql.org/docs/12/server-start.html for further
# justification of this as the default value, namely that the example (and
# shipped) systemd service files use the "Fast Shutdown mode" for service
# termination.
#
STOPSIGNAL SIGINT

EXPOSE 5432
# Install dockerize, we still need it when running Postgres using docker-compose
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# Install node
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get update
RUN apt install -y sudo nodejs && rm -rf /var/lib/apt/lists/*

# Change work directory
WORKDIR /code/

# Copy all the requirements
COPY requirements* ./
RUN pip install --no-cache-dir -r ${PYTHON_REQUIREMENTS} --force-reinstall sqlalchemy-filters
COPY . .

RUN sudo npm install -g npm-force-resolutions
RUN cd mathesar_ui && npm install --unsafe-perm && npm run build
EXPOSE 8000 3000 6006
ENTRYPOINT ["./run.sh"]