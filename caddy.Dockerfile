# Useful when we need to build a single dockerfile to run a complete webservice
ARG BASE_IMAGE=python:3.9-buster
FROM $BASE_IMAGE as base_image

ENV PORT=8000

RUN apt-get update
RUN apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
RUN apt-get update
RUN apt install caddy

EXPOSE 80 443 2015

COPY Caddyfile /etc/caddy/Caddyfile

ENTRYPOINT ["/usr/bin/caddy"]
CMD ["--config", "/etc/caddy/Caddyfile", "--log", "stdout"]