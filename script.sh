#!/bin/sh

set -e

TS=$(date +%s)

# === 下载 emby-crx 资源 ===

echo "🧹 清理旧 emby-crx 目录..."
rm -rf emby-crx
mkdir -p emby-crx

echo "⬇️ 下载资源..."
wget -q https://raw.githubusercontent.com/dingdadao/emby-crx/master/static/css/style.css -P emby-crx/
wget -q https://raw.githubusercontent.com/dingdadao/emby-crx/master/static/js/common-utils.js -P emby-crx/
wget -q https://raw.githubusercontent.com/dingdadao/emby-crx/master/static/js/jquery-3.6.0.min.js -P emby-crx/
wget -q https://raw.githubusercontent.com/dingdadao/emby-crx/master/static/js/md5.min.js -P emby-crx/
wget -q https://raw.githubusercontent.com/dingdadao/emby-crx/master/content/main.js -P emby-crx/
# wget -q https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css -P emby-crx/
# wget -q https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js -P emby-crx/

echo "✅ 资源下载完成"

# === 插入 HTML 脚本块 ===

if [ ! -f index.html ]; then
  echo "❌ 找不到 index.html 文件"
  exit 1
fi

# 删除旧插入块
sed -i '/<!-- EMBY-CRX-START -->/,/<!-- EMBY-CRX-END -->/d' index.html

# 构造插入代码
# cat > .emby_block.html <<EOF
# <!-- EMBY-CRX-START -->
# <link rel="stylesheet" href="emby-crx/swiper-bundle.min.css?v=$TS" />
# <link rel="stylesheet" id="theme-css" href="emby-crx/style.css?v=$TS" type="text/css" media="all" />
# <script src="emby-crx/common-utils.js?v=$TS"></script>
# <script src="emby-crx/jquery-3.6.0.min.js?v=$TS"></script>
# <script src="emby-crx/md5.min.js?v=$TS"></script>
# <script src="emby-crx/main.js?v=$TS"></script>
# <script src="emby-crx/swiper-bundle.min.js?v=$TS"></script>
# <!-- EMBY-CRX-END -->
# EOF
cat > .emby_block.html <<EOF
<!-- EMBY-CRX-START -->
<link rel="stylesheet" id="theme-css" href="emby-crx/style.css?v=$TS" type="text/css" media="all" />
<script src="emby-crx/common-utils.js?v=$TS"></script>
<script src="emby-crx/jquery-3.6.0.min.js?v=$TS"></script>
<script src="emby-crx/md5.min.js?v=$TS"></script>
<script src="emby-crx/main.js?v=$TS"></script>
<!-- EMBY-CRX-END -->
EOF

# 获取 </body> 行号
BODY_LINE=$(grep -n '</body>' index.html | cut -d: -f1 | head -n 1)

if [ -z "$BODY_LINE" ]; then
  echo "❌ 未找到 </body> 标签，插入失败"
  rm -f .emby_block.html
  exit 1
fi

# 在 </body> 前插入
sed -i "${BODY_LINE}r .emby_block.html" index.html

rm -f .emby_block.html

echo "✅ emby-crx 成功插入 index.html，时间戳：$TS"
