FROM python:3.12.3

# sudo apt install imagemagick
# RUN apt-get update && apt-get install -y imagemagick

WORKDIR /app
COPY requirements.txt /app/
RUN pip install -r requirements.txt
COPY . /app/.
CMD ["python", "text.py"]
