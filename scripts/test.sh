#!/usr/bin/env bash

docker-compose -f docker-compose.test.yaml up --abort-on-container-exit --exit-code-from sut --attach sut