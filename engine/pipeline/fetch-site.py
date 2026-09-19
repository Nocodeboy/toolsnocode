import json, sys, re, html, subprocess
S='/tmp/claude-0/-home-user-toolsnocode/5f58734e-5900-5f67-9878-48df5f1027d1/scratchpad'
slug, url = sys.argv[1], sys.argv[2]
def meta(h, name):
    m = re.search(r'<meta[^>]+(?:name|property)=["\']%s["\'][^>]*content=["\']([^"\']*)' % re.escape(name), h, re.I) or \
        re.search(r'<meta[^>]+content=["\']([^"\']*)["\'][^>]*(?:name|property)=["\']%s["\']' % re.escape(name), h, re.I)
    return html.unescape(m.group(1)).strip() if m else ''
try:
    r = subprocess.run(['curl','-sS','-L','--max-time','20','--compressed','-A','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36',url], capture_output=True, text=True, errors='replace', timeout=30)
    h = r.stdout
    if not h or r.returncode not in (0,):
        out = {'slug': slug, 'ok': False, 'error': (r.stderr or 'empty')[:120]}
    else:
        body = re.sub(r'<(script|style|noscript|svg)[\s\S]*?</\1>', ' ', h, flags=re.I)
        text = re.sub(r'<[^>]+>', ' ', body); text = html.unescape(re.sub(r'\s+', ' ', text)).strip()
        h1 = re.findall(r'<h1[^>]*>([\s\S]*?)</h1>', body, re.I)
        h2 = re.findall(r'<h2[^>]*>([\s\S]*?)</h2>', body, re.I)
        clean = lambda xs: [html.unescape(re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',x))).strip() for x in xs][:6]
        out = {'slug': slug, 'ok': True, 'title': (re.search(r'<title[^>]*>([^<]*)', h, re.I) or [None,''])[1].strip(),
               'description': meta(h,'description'), 'og_description': meta(h,'og:description'), 'og_title': meta(h,'og:title'),
               'h1': clean(h1), 'h2': clean(h2), 'text': text[:2500], 'lang': (re.search(r'<html[^>]*lang=["\']([a-zA-Z-]+)', h) or [None,''])[1]}
except Exception as e:
    out = {'slug': slug, 'ok': False, 'error': str(e)[:120]}
print(json.dumps(out, ensure_ascii=False))
