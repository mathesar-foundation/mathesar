FROM python:3.9-buster
ARG PYTHON_REQUIREMENTS=requirements.txt
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

# Copy the base requirements needed for other requirements file
COPY requirements* .

RUN pip install --no-cache-dir -r ${PYTHON_REQUIREMENTS} --force-reinstall sqlalchemy-filters
COPY . .

RUN sudo npm install -g npm-force-resolutions
RUN cd mathesar_ui && npm install --unsafe-perm && npm run build
EXPOSE 8000 3000 6006
