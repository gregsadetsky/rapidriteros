FROM python:3.12.3

WORKDIR /app

# sudo apt install imagemagick
# RUN apt-get install -y imagemagick
RUN apt-get install -y wget
RUN wget https://imagemagick.org/archive/binaries/magick
RUN chmod +x magick
RUN pwd
RUN ls -ltra

COPY requirements.txt /app/
RUN pip install -r requirements.txt
COPY . /app/.

RUN pwd
RUN ls -ltra

CMD ["python", "text.py"]
