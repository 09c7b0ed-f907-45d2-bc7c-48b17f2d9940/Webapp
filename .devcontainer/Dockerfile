FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

WORKDIR /workspace

RUN apt-get update && apt-get install -y \
  && apt-get clean -y && rm -rf /var/lib/apt/lists/*

EXPOSE 3000

CMD ["sleep", "infinity"]