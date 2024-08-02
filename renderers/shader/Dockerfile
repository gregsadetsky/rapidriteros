FROM nikolaik/python-nodejs:python3.12-nodejs22

WORKDIR /app
COPY requirements.txt /app/
RUN pip install -r requirements.txt

RUN apt-get update
RUN apt-get install -y libsdl-pango-dev

WORKDIR /app
COPY subrenderer/package.json /app/subrenderer/
RUN npm install --prefix subrenderer

COPY . /app/.
CMD ["python", "shader.py"]
