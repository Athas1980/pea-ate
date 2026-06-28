#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"
if [[ -z "$VERSION" ]]; then
  echo "Usage: ./release.sh v<x.y.z>"
  exit 1
fi

ORIGINAL_BRANCH=$(git symbolic-ref --short HEAD)

if [[ "$ORIGINAL_BRANCH" != "develop" ]]; then
  echo "Must be on develop branch to release (currently on '$ORIGINAL_BRANCH')"
  exit 1
fi

cleanup() {
  git checkout "$ORIGINAL_BRANCH" 2>/dev/null || true
}
trap cleanup EXIT

echo "==> Bumping package.json to ${VERSION#v}..."
npm version "${VERSION#v}" --no-git-tag-version
git commit -am "Bump version to $VERSION"
git push origin develop

echo "==> Building..."
npm run build

echo "==> Zipping..."
rm -f pea-ate.zip
zip -r pea-ate.zip dist/

echo "==> Merging develop into main..."
git checkout main
git merge --no-ff develop -m "Release $VERSION"

echo "==> Tagging $VERSION..."
git tag "$VERSION"

echo "==> Pushing..."
git push
git push --tags

echo "==> Creating GitHub release..."
gh release create "$VERSION" pea-ate.zip \
  --title "$VERSION" \
  --generate-notes

git checkout develop
echo "==> Done. Back on develop."
