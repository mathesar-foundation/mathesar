FROM python:3.9-buster

ENV PYTHONUNBUFFERED=1
ENV DOCKERIZE_VERSION v0.6.1

# Install dockerize
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# Install node
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get update
RUN apt install -y sudo nodejs && rm -rf /var/lib/apt/lists/*

# Change work directory
WORKDIR /code/

COPY requirements.txt .
COPY requirements-dev.txt .

RUN pip install -r requirements.txt --force-reinstall sqlalchemy-filters
RUN pip install -r requirements-dev.txt
COPY . .

RUN sudo npm install -g npm-force-resolutions
RUN cd mathesar_ui && npm install --unsafe-perm && npm run build

EXPOSE 8000 3000 6006
