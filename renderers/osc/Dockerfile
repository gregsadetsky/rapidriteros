FROM python:3.12.3
WORKDIR /app
COPY requirements.txt /app/
RUN pip install -r requirements.txt
COPY . /app/.
CMD ["uvicorn", "osc:app", "--port", "8000", "--host", "0.0.0.0"]