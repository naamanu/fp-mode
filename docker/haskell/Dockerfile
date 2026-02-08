FROM haskell:9.8-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends coreutils && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
