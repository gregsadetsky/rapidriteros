# Rapid Riter OS

<img src="https://github.com/user-attachments/assets/8c83438a-b475-4aa2-a457-cfa5b6127c11" style="width:500px">

[see a video here](https://www.youtube.com/watch?v=qUvQodUYQGg)

## what is this?

the "Rapid Riter" is a LED display from the 1980s (the copyright on the PCB says 1985), 96 pixels wide by 38 pixels high. it's both giant and tiny.

the display is currently installed at the [Recurse Center](https://www.recurse.com/)

this repo/software runs on a connected raspberry pi and goes through "shows" i.e. text, [p5.js](https://p5js.org/) scripts, GLSL shaders, WASM programs, and renders them all on the LED display

(this repo) also presents a django-based web UI so that people can add/edit shows. that is mostly a work in progress.

the rapidriter code is deployed and managed using [disco](https://letsdisco.dev/)

## thanks

- thanks to [Antoine Leclair](https://github.com/antoineleclair/) for his help in architecturing and all things async!
- thanks to [MaxD](https://github.com/maxdee) who retrofit the display so that it would accept frames over UDP at over 40fps!
- thanks to [Jesse Chen](https://github.com/jessechen) for the custom pixel font aka "bubbletea"! More info in [the font's repo](https://github.com/jessechen/bubbletea)!
- thanks to [Brandon Sprague](https://github.com/bcspragu) for the WASM renderer!
- thanks to [Jakub Sygnowski](https://github.com/sygi) for help restoring the rapidriter raspi sd card, debugging, extending the p5 renderer, and the upcoming raspi ssd upgrade!
- thanks to [Stephen D](https://www.scd31.com/) for his contributions re Rust / WASM template and for creating a local simulator - [available here](https://gitlab.scd31.com/stephen/rapidriter-cat)!
- thanks to [Florian Ragwitz](https://github.com/rafl) for their help in making the "show immediately" functionality work again, and a much needed refactoring of the main worker loop codebase!

---

<details>

<summary>how to start / run locally</summary>

### pre-setup

- clone this repo
- make a copy of `web/.env.example` into `web/.env`
- make a copy of `worker/.env.example` into `worker/.env`
- the first time, go into `web`, create a `venv`, and run `pip install -r requirements.txt`
- do the same in the `worker` directory (venv, install req's)
- in the web directory, run `python manage.py migrate`

### run

- start django (i.e. the web backend)

```bash
cd web
source venv/bin/activate
# do not use python manage.py runserver!!!
# do not use python manage.py runserver!!!
./bin/serve-dev.sh
# WARNING: this does not have autoreload on save.......!!! yet!!!!!!!
```

- start the web frontend

```bash
cd web/frontend
npm run dev
```

- start the worker

```bash
cd worker
source venv/bin/activate
python worker.py
```

- start a renderer, for example p5js:
  - this assumes that you've created a `venv` + `pip install`ed, and also ran npm install within `p5/subrenderer`

```bash
cd renderers/p5
source venv/bin/activate
python p5.py
```

- other renderers might require `npm install`, etc.

</details>


<details>

<summary>Running everything in Docker</summary>

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

</details>

---

### renderer notes

- the p5 renderer needs node v22 (`nvm use` should work)
  - you might also need to run `brew install pkgconf` in the `subrenderer` directory

### things that have not been tried / ideas / sort of brainstorm

- I (Greg) don't exactly know what the display frame rate is. from my sort of tests, it's somewhere around 40 fps. figuring this out could be useful!
- TODO greg - add firmware code from Max D and photos from conversion of the riter from its original form to its current form into this repo (this might also help with the frame rate question)
- PWM would be really fascinating to get working... my initial tests led to some wonky/not satisfying results... maybe you can crack it..???
- not a lot of shows use network requests (at least one does, but that's it) - that could be something interesting to play with for future shows
- the wasm renderer - as far as I know/understand - would not allow you to do network calls right now (I could be wrong). it would be great if that was possible, as it is possible with the p5 renderer
- it could be cool if a webcam was filming the riter and streaming it for others to see outside the hub... (but obviously not film people around it)
- what if there were usb joysticks attached to the raspberry pi that the renderers would have access to?? you could sort of do interactive shows right now with a renderer that used network requests.... 
- a tixy.land mode would be great! a python mode would be great as well! and a gif mode! and a youtube mode!
- a mic mode could be great that could do audio reactive stuff??
- maybe a speaker (whose volume could be turned down) for some audio output?
