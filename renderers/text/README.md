# Text

## Build
```bash
docker build -t rapidriteros/text .
```

## Run
```bash
docker run \
    --publish 8081:80 \
    --volume .:/app \
    rapidriteros/text
```
