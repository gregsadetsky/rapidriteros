FROM python:3.12.3

WORKDIR /app
COPY requirements.txt /app/
RUN pip install -r requirements.txt

FROM node:22.4.1

RUN apt install libsdl-pango-dev

WORKDIR /app
COPY subrenderer/package.json /app/subrenderer/
RUN npm install --prefix subrenderer

COPY . /app/.
CMD ["python", "p5.py"]
