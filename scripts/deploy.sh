#!/usr/bin/env bash
set -euo pipefail

BRANCH="main"

if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working directory is not clean. Commit or stash changes first."
  exit 1
fi

CURRENT=$(git branch --show-current)
if [ "$CURRENT" != "$BRANCH" ]; then
  echo "Error: Not on $BRANCH branch (currently on $CURRENT)."
  exit 1
fi

echo "Patching version..."
NEW_VERSION=$(npm version patch --no-git-tag-version)
echo "New version: $NEW_VERSION"

git add package.json package-lock.json 2>/dev/null || git add package.json
git commit -m "release $NEW_VERSION"
git tag "$NEW_VERSION"

echo "Pushing to origin/$BRANCH..."
git push origin "$BRANCH" --tags

echo "Done! $NEW_VERSION pushed — Vercel will pick it up."
