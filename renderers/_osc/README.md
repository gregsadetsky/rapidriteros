# OSC

## Build
```bash
docker build -t rapidriteros/osc .
```

## Run
```bash
docker run \
    --publish published=12000,target=12000,protocol=udp \
    --publish 8080:80 \
    --volume .:/app \
    rapidriteros/osc
```
