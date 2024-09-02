FROM python:3.12.3

# sudo apt install imagemagick
# RUN apt-get install -y imagemagick
RUN apt-get install -y wget
RUN wget https://imagemagick.org/archive/binaries/magick
RUN chmod +x magick

WORKDIR /app
COPY requirements.txt /app/
RUN pip install -r requirements.txt
COPY . /app/.
CMD ["python", "text.py"]
