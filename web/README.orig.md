# Django project rapidriter

Hi! This is the Django source for rapidriter.

## TODO

If you followed the [Minimalish Django starter](https://github.com/gregsadetsky/minimalish-django-starter) instructions, you still have a couple of steps to go to make a thing that lives on the internet.

next:

- fill out the values in the `.env` file
- make sure your venv is still active, otherwise `source venv/bin/activate`
- run `python manage.py migrate`
- start the server with `python manage.py runserver`
- go to http://localhost:8000/ and do good work!
- to see the vite/react index page, head to http://localhost:8000/react
  - the frontend TypeScript code is under `core/frontend/src/`

to deploy using disco, create a new github repo with your new directory, and refer to the [disco Django+SQLite docs](https://docs.letsdisco.dev/deployment-guides/django).

# Development basics

## The first time

To get started, navigate to the directory where this code lives. If you're downloading this code fresh, you'll need to run these commands:

```
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

then, for the frontend piece:

```
cd core/frontend
npm install
```

## Every time


Once your backend + frontend environments are setup (see above), run the following to start the project:

- in one terminal, for the backend:

```
source venv/bin/activate
python manage.py runserver
```

- in another terminal, for the frontend

```
cd core/frontend
npm run dev
```

If you get hollered at to run some other command like `python manage.py migrate` hit Ctrl-C to stop the backend, do that and then run `python manage.py runserver` again. It's all good!

-----

[powered by Minimalish](https://github.com/gregsadetsky/minimalish-django-starter) 
