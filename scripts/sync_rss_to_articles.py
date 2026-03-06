#!/usr/bin/env python3
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from urllib.request import Request, urlopen

RSS_URL = os.environ.get('WECHAT_RSS_URL', '').strip()
OUT_PATH = os.environ.get('OUT_PATH', 'js/articles-data.js')

if not RSS_URL:
    print('WECHAT_RSS_URL is required')
    sys.exit(1)

req = Request(RSS_URL, headers={'User-Agent': 'Mozilla/5.0'})
with urlopen(req, timeout=30) as resp:
    xml_data = resp.read().decode('utf-8', errors='ignore')

root = ET.fromstring(xml_data)
channel = root.find('channel') if root.tag == 'rss' else root
if channel is None:
    print('Invalid RSS format')
    sys.exit(1)

items = []
for item in channel.findall('item')[:120]:
    title = (item.findtext('title') or '').strip()
    link = (item.findtext('link') or '').strip()
    desc = (item.findtext('description') or '').strip()
    desc = re.sub(r'<[^>]+>', '', desc)
    desc = re.sub(r'\s+', ' ', desc).strip()[:160]

    if not title or not link:
        continue

    tags = ['公众号']
    text = (title + ' ' + desc)
    for k in ['漏洞', 'SRC', '红队', '工具', '靶场', 'SQL', 'Java', '代码审计']:
        if k.lower() in text.lower():
            tags.append(k)

    items.append({
        'title': title,
        'url': link,
        'summary': desc,
        'tags': sorted(set(tags), key=tags.index)
    })

content = 'window.C4_ARTICLES = ' + json.dumps(items, ensure_ascii=False, indent=2) + ';\n'
with open(OUT_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'updated {OUT_PATH} with {len(items)} articles from RSS')
