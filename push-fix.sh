#!/bin/bash
cd "$(dirname "$0")"

echo "📦 Adding changes..."
git add -A

echo "📝 Committing..."
git commit -m "feat: 完善功能牌逻辑+UI展示(卓柏卡布拉吞牌/背包砍刀暂存/豹汁标记/中央卡牌/爆牌判定修复)"

echo "🚀 Pushing to GitHub..."
git push origin main 2>&1

echo ""
echo "✅ Done!"
