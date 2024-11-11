ARG PYTHON_VERSION=3.9-bookworm
FROM python:3.11
WORKDIR /code/
COPY . .
RUN pip install -r requirements.txt
CMD pytest -svv
