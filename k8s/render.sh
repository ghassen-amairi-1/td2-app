#!/bin/sh
# Fill the manifest templates with the image user and tag.
set -eu
: "${DOCKERHUB_USER:?DOCKERHUB_USER is not set}"
: "${IMAGE_TAG:?IMAGE_TAG is not set}"
mkdir -p rendered
for f in k8s/*.yaml; do
  sed -e "s|\${DOCKERHUB_USER}|$DOCKERHUB_USER|g" \
      -e "s|\${IMAGE_TAG}|$IMAGE_TAG|g" \
      "$f" > "rendered/$(basename "$f")"
done
grep -h "image:" rendered/*.yaml
