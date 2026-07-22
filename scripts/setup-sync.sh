#!/usr/bin/env bash
set -e

echo "=================================="
echo "  CNB-GitHub Dual Sync Setup"
echo "=================================="
echo ""

CNB_REMOTE=""
GH_REMOTE=""

if git remote get-url origin 2>/dev/null | grep -qE '(cnb\.cool|cnb\.woa\.com)'; then
  CNB_REMOTE=$(git remote get-url origin 2>/dev/null | head -1)
elif git remote get-url cnb 2>/dev/null | grep -qE '(cnb\.cool|cnb\.woa\.com)'; then
  CNB_REMOTE=$(git remote get-url cnb 2>/dev/null | head -1)
fi

if git remote get-url origin 2>/dev/null | grep -q 'github.com'; then
  GH_REMOTE=$(git remote get-url origin 2>/dev/null | head -1)
elif git remote get-url github 2>/dev/null | grep -q 'github.com'; then
  GH_REMOTE=$(git remote get-url github 2>/dev/null | head -1)
fi

CNB_EXTRACTED_SLUG=""
if [ -n "$CNB_REMOTE" ]; then
  CNB_EXTRACTED_SLUG=$(echo "$CNB_REMOTE" | sed -E 's|https://cnb\.(cool|woa\.com)/(.*)\.git|\2|' | sed 's|/$||')
fi

GH_EXTRACTED_REPO=""
if [ -n "$GH_REMOTE" ]; then
  GH_EXTRACTED_REPO=$(echo "$GH_REMOTE" | sed -E 's|(https://|git@)?github\.com[:/](.*)\.git|\2|')
  GH_EXTRACTED_REPO="https://github.com/$GH_EXTRACTED_REPO.git"
fi

echo "[detect] CNB slug:  ${CNB_EXTRACTED_SLUG:-<not found>}"
echo "[detect] GitHub url: ${GH_EXTRACTED_REPO:-<not found>}"
echo ""

read -p "CNB repo slug  (e.g. buzhi/ZMU/webase): " -i "${CNB_EXTRACTED_SLUG:-}" CNB_SLUG
read -p "GitHub repo    (e.g. https://github.com/org/repo.git): " -i "${GH_EXTRACTED_REPO:-}" GITHUB_REPO
read -p "Main branch    [main]: " -i "main" BRANCH
BRANCH=${BRANCH:-main}

echo ""
echo "--- writing .sync-config ---"
cat > .sync-config <<EOF
TARGET_GITHUB_REPO=${GITHUB_REPO}
TARGET_CNB_SLUG=${CNB_SLUG}
MAIN_BRANCH=${BRANCH}
EOF
echo "Written: .sync-config"
cat .sync-config

echo ""
echo "--- configuring git dual-push remotes ---"

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "[!] No 'origin' remote found."
else
  CNB_URL="https://cnb.cool/${CNB_SLUG}.git"
  echo "  Setting origin push to: $CNB_URL"
  git remote set-url origin --push "$CNB_URL"
  echo "  Adding push to: $GITHUB_REPO"
  git remote set-url origin --push --add "$GITHUB_REPO"
fi

echo ""
echo "--- credential checks ---"

if command -v cnb &>/dev/null; then
  if cnb status 2>&1 | grep -q '已登录'; then echo "[OK] cnb logged in"; else echo "[!] cnb NOT logged in — run: cnb login"; fi
else
  echo "[!] cnb CLI not found"
fi

if command -v gh &>/dev/null; then
  if gh auth status 2>&1 | grep -q 'Logged in'; then echo "[OK] gh  logged in"; else echo "[!] gh NOT logged in — run: gh auth login"; fi
else
  echo "[!] gh CLI not found"
fi

echo ""
echo "=================================="
echo "  Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "  1. Create a CNB access token:"
echo "     https://cnb.cool/settings/tokens"
echo "     Permissions needed: repo-code:rw"
echo ""
echo "  2. Add it as GitHub secret:"
if command -v gh &>/dev/null; then
  echo "     gh secret set CNB_TOKEN -b\"<your-cnb-token>\""
else
  echo "     GitHub repo Settings → Secrets and variables → Actions → CNB_TOKEN"
fi
