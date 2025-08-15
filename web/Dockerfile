FROM nikolaik/python-nodejs:python3.12-nodejs22

WORKDIR /code

RUN pip install --no-compile --no-cache-dir magic-wormhole

# docker will not re-pip install if requirements.txt doesn't change
COPY ./requirements.txt /code/requirements.txt
RUN pip install -r requirements.txt

COPY ./core/frontend/package.json /code/core/frontend/package.json
COPY ./core/frontend/package-lock.json /code/core/frontend/package-lock.json
RUN (cd /code/core/frontend && npm ci)

# building the vite project implies more files - package lock,
# tsconfig (which we're not using, but could),
# the main typescript and all related typescript code.... so just include everything
# at this point
COPY . /code
RUN (cd /code/core/frontend && npm run build)

# build the django static files, passing the env vars to the command
# otherwise the django build will fail
RUN --mount=type=secret,id=.env env $(cat /run/secrets/.env | xargs) python manage.py collectstatic --no-input

# launch it
CMD ["bin/serve.sh"]
