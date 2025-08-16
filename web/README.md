# Rapid Riter Django Web UI

## how to run locally

### first time

- make a copy of the `.env.example` file and call the copy `.env`
- fill out the `DJANGO_SECRET_KEY` value in `.env` with a random secret-ish string
- then, run:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
```

### every time

```bash
source venv/bin/activate
python manage.py runserver
```

## notes re: running/dealing with oauth locally

- activate the venv, then start the django server - `python manage.py runserver`
- run ngrok - `ngrok http 8000`
- go to https://www.recurse.com/domains and update the `rapidriter-dev.recurse.com` domain to point to the ngrok domain it `https://...ngrok-free.app`
- update the `.env` and add the ngrok domain to `ALLOWED_HOSTS`
