FROM python:3-buster

RUN apt update
RUN apt install -y sudo

# Add mathesar user
RUN sudo useradd -m mathesar

ENV PYTHONUNBUFFERED=1
ENV DOCKERIZE_VERSION v0.6.1

# Install dockerize
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# Install node
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash -
RUN apt install -y nodejs

# Change work directory
WORKDIR /home/mathesar/code/
RUN chown -R mathesar:mathesar /home/mathesar/code/
ENV PATH="/home/mathesar/.local/bin:${PATH}"

COPY --chown=mathesar:mathesar requirements.txt .
COPY --chown=mathesar:mathesar requirements-dev.txt .

USER mathesar
RUN pip install -r requirements.txt --force-reinstall sqlalchemy-filters
RUN pip install -r requirements-dev.txt
COPY --chown=mathesar:mathesar . .

RUN cd mathesar_ui && npm install && npm run build
