# Example disco Django Site

[See the documentation here](https://docs.letsdisco.dev/deployment-guides/django)

---

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
