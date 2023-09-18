FROM python:3.9-buster
ARG PYTHON_REQUIREMENTS=requirements.txt
ENV PYTHONUNBUFFERED=1
ENV DOCKERIZE_VERSION v0.6.1
ENV NODE_MAJOR 18

# Install dockerize
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# Install node
RUN apt-get update
RUN apt-get install -y ca-certificates curl gnupg
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

RUN cd mathesar_ui && npm ci --unsafe-perm && npm run build
EXPOSE 8000 3000 6006
ENTRYPOINT ["./run.sh"]
