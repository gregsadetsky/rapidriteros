# rapidriteros

## how to start / run locally

### pre-setup

- make a copy of `web/.env.example` into `web/.env`
- make a copy of `worker/.env.example` into `worker/.env`

### run

- start django

```bash
cd web
source venv/bin/activate
python manage.py runserver
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