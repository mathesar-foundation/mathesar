ARG PYTHON_VERSION=3.9-bookworm
FROM python:$PYTHON_VERSION
WORKDIR /code/
COPY . .
RUN pip install -r requirements.txt
CMD pytest -svv
