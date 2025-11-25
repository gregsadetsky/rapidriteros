FROM rust:1.91.1 AS builder

RUN update-ca-certificates

RUN USER=root cargo new --bin app
WORKDIR /app
COPY Cargo.toml Cargo.lock ./

RUN cargo build --release

# Remove the dummy source and any binary deps. Something about timestamps (or
# something?) causes the second `cargo build` to not actually rebuild anything.
RUN rm src/*.rs target/release/deps/wasm-*

COPY ./src ./src

# Do the real build
RUN cargo build --release

# Create appuser
ENV USER=noroot
ENV UID=1000

RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    "${USER}"

FROM gcr.io/distroless/cc@sha256:f913198471738d9eedcd00c0ca812bf663e8959eebff3a3cbadb027ed9da0c38

# Import from builder.
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group

WORKDIR /app

# Copy our build
COPY --from=builder /app/target/release/wasm .

# Use an unprivileged user.
USER noroot:noroot

CMD ["/app/wasm"]
