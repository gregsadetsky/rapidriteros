FROM python:3.12.3

###

RUN build_glslviewer.sh

###

WORKDIR /app
COPY requirements.txt /app/

RUN pip install -r requirements.txt

COPY . /app/.
CMD ["uvicorn", "shader:app", "--port", "80", "--host", "0.0.0.0"]