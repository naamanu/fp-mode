FROM ocaml/opam:ubuntu-24.04-ocaml-5.2

USER root
RUN apt-get update && \
    apt-get install -y --no-install-recommends coreutils && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
