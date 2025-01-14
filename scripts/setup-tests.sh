#!/bin/sh

# These exports enable Podman compatibility for @testcontainers/postgresql

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    systemctl --user start podman.socket

    export DOCKER_HOST=unix://${XDG_RUNTIME_DIR}/podman/podman.sock
elif [[ "$OSTYPE" == "darwin"* ]]; then
    export DOCKER_HOST=unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')
    export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
fi
