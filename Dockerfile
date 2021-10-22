FROM pavish73/mathesar-base:latest-all

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
