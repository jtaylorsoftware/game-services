#!/usr/bin/env bash

docker-compose -f docker-compose.test.yaml up --build --abort-on-container-exit --exit-code-from sut --attach sut