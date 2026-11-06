FROM rust:1.99-slim

WORKDIR /app

COPY . .

RUN cargo build --release

EXPOSE 8000

CMD ["cargo", "run", "--release"]
