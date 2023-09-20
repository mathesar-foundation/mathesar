FROM python:3.9-buster
ARG PYTHON_REQUIREMENTS=requirements.txt
ENV PYTHONUNBUFFERED=1
ENV DOCKERIZE_VERSION v0.6.1

ENV PG_MAJOR 15
RUN set -eux; \
	apt-get update; apt-get install -y --no-install-recommends locales; rm -rf /var/lib/apt/lists/*; \
	localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8
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
VOLUME /etc/postgres/
VOLUME /var/lib/postgresql/mathesar


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