#!/bin/bash
cd "$(dirname "$0")"

echo "📦 Adding changes..."
git add -A

echo "📝 Committing..."
git commit -m "fix: 危险区改为全场累加显示 + 加入功能牌系统(贿赂/背包/豹汁/雕像/砍刀/卓柏卡布拉)"

echo "🚀 Pushing to GitHub..."
git push origin main 2>&1

echo ""
echo "✅ Done!"
