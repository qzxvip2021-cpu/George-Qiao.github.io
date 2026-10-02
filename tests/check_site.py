"""Dependency-free checks for portfolio markup and local references."""
from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids = []; self.links = []; self.files = []; self.h1 = 0; self.main = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        if tag == 'h1': self.h1 += 1
        if tag == 'main': self.main += 1
        if tag == 'a':
            self.links.append(a.get('href', ''))
            if a.get('target') == '_blank': assert 'noopener' in a.get('rel', ''), a
        if tag == 'img': assert 'alt' in a, a
        for key in ('src', 'href'):
            if a.get(key, '').startswith('./'): self.files.append(a[key].split('#')[0])
parser = SiteParser(); source = (ROOT / 'index.html').read_text(); parser.feed(source)
assert parser.h1 == 1 and parser.main == 1
assert len(parser.ids) == len(set(parser.ids)), 'Duplicate IDs'
for link in parser.links:
    assert link, 'Empty link'
    if link.startswith('#'): assert link[1:] in parser.ids, link
for path in parser.files: assert (ROOT / path).is_file(), path
assert not re.search(r'qxzvip|rushhiii|Tirth|rising Junior|alumniOf|mater-dei-course-guide', source)
assert 'Class of 2028' in source
assert 'prefers-reduced-motion' in (ROOT / 'assets/css/style.css').read_text()
print(f'PASS: semantic landmarks, unique IDs, {len(parser.links)} links, local assets, external-link safety, content guards, reduced-motion support')
