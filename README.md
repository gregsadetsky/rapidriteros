# Rapid Riter OS

<img src="https://github.com/user-attachments/assets/8c83438a-b475-4aa2-a457-cfa5b6127c11" style="width:500px">

[see a video here](https://www.youtube.com/watch?v=qUvQodUYQGg)

## what is this?

the "Rapid Riter" is a LED display from the 1980s (the copyright on the PCB says 1985), 96 pixels wide by 38 pixels high. it's both giant and tiny.

the display is currently installed at the [Recurse Center](https://www.recurse.com/)

this repo/software runs on a connected raspberry pi and goes through "shows" i.e. text, [p5.js](https://p5js.org/) scripts, and GLSL shaders, and renders them all on the LED display

(this repo) also presents a django-based web UI so that people can add/edit shows. that is mostly a work in progress.

the rapidriter/raspberry pi are hosted + deployed + managed using [disco](https://letsdisco.dev/)

## thanks

- huge thanks to [Antoine Leclair](https://github.com/antoineleclair/) for his help in architecturing and all things async!
- thanks to [MaxD](https://github.com/maxdee) who retrofit the display so that it would accept frames over UDP at over 40fps!
- thanks to [Jesse Chen](https://github.com/jessechen) for the custom pixel font aka "bubbletea"! More info in [the font's repo](https://github.com/jessechen/bubbletea)!
- thanks to [Brandon Sprague](https://github.com/bcspragu) for the WASM renderer!

---

## how to start / run locally

### pre-setup

- make a copy of `web/.env.example` into `web/.env`
- make a copy of `worker/.env.example` into `worker/.env`

### run

- start django

```bash
cd web
source venv/bin/activate
./bin/serve.sh
```

- start worker

```bash
cd worker
source venv/bin/activate
python worker.py
```

- start a renderer, for example p5js:

```bash
cd renderers/p5
source venv/bin/activate
python p5.py
```

- other renderers might require `npm install`, etc.

## Running everything in Docker

1. Create a bridge network with `docker network create rapidriter`

2. Build and run the web server

```bash
cd web

docker build -t rapidriteros/web .

docker run \
  --rm \
  --network=rapidriter \
  --name=rrweb \
  -p 8000:8000 \
  rapidriteros/web
```

3. Build and run the worker

First, make sure you have a `worker/.env` that looks something like:

```
RENDERER_OSC_HOST=""
RENDERER_TEXT_HOST="http://rrtext:80"
RENDERER_SHADER_HOST=""
RENDERER_P5_HOST=""
RENDERER_WASM_HOST="http://rrwasm:80"

DO_NOT_SEND_TO_RITER="true"

WEB_SERVICE_HOST="http://rrweb:8000"
```

The `rrtext`, `rrwasm`, and `rrweb` refer to the other containers by their names using in-Docker networking.

```bash
cd worker

docker build -t rapidriteros/worker .

docker run \
  --rm \
  --volume .:/app \
  --network=rapidriter \
  rapidriteros/worker
```

4. Build and run (for example) the text renderer

```bash
cd renderers/text

docker build -t rapidriteros/text .

docker run \
  --rm \
  --network=rapidriter \
  --name=rrtext \
  rapidriteros/text
```

5. Add the WASM renderer for good measure

```bash
cd renderers/wasm

docker build -t rapidriteros/wasm .

docker run \
  --rm \
  --network=rapidriter \
  --name=rrwasm \
  rapidriteros/wasm
```
