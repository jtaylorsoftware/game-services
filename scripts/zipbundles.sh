#!/usr/bin/env bash

# Create a valid package.json to set "type" to "module".
echo '{
  "name": "lambda",
  "private": true,
  "type": "module"
}' > bundles/package.json

# Create individual .zip for each Lambda source in bundles/
for path in bundles/*; do
    [ -d "${path}" ] || continue;
    zip -j "${path}.zip" "${path}/index.js" bundles/package.json
done;