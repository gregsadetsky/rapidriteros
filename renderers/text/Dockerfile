FROM python:3.12.3

WORKDIR /app

# sudo apt install imagemagick
# RUN apt-get install -y imagemagick
# RUN apt-get install -y wget
# RUN wget https://imagemagick.org/archive/binaries/magick
# RUN chmod +x magick

RUN apt-get update
RUN apt install -y build-essential make git
RUN git clone https://github.com/ImageMagick/ImageMagick.git
WORKDIR ImageMagick
RUN ./configure
RUN make
RUN make install
RUN ldconfig /usr/local/lib
RUN convert -version

WORKDIR /app

COPY requirements.txt /app/
RUN pip install -r requirements.txt
COPY . /app/.

CMD ["python", "text.py"]
