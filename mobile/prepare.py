import hashlib, pathlib, zipfile, sys, json, re, shutil
with zipfile.ZipFile(sys.argv[1]) as z:
    files={n.split('/',1)[1]:z.read(n) for n in z.namelist() if not n.endswith('/')}
h=hashlib.sha256()
for p,b in sorted(files.items()):
    h.update(p.encode()+b'\0'+hashlib.sha256(b).digest())
assert len(files)==159 and h.hexdigest()=="db96945d482af21e4463fcf57982ae6e470fe4a397f61d4be8a2c83c11a68ae1"
root=pathlib.Path(sys.argv[2])
for p,b in files.items():
    dest=root/p
    assert dest.resolve().is_relative_to(root.resolve())
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_bytes(b)
# The original UI files and AniList module are compiled directly.
# Remove service worker and tracking, replace the server entrypoint with the mobile shell.
for p in ['public/sw.js','public/workbox-4754cb34.js','public/manifest.json']:
    (root/p).unlink(missing_ok=True)
mobile=pathlib.Path(__file__).resolve().parent
for name in ['android-main.tsx','android-link.tsx','android-image.tsx','mobile.css']:
    shutil.copyfile(mobile/name,root/'src'/name)
for name in ['index.html','vite.config.ts']:
    shutil.copyfile(mobile/name,root/name)
(root/'public/yuuz-logo.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><rect width="108" height="108" rx="22" fill="#101010"/><path fill="#fff" d="M22 25H37L54 48 71 25H86L61 60V83H47V60Z"/></svg>')
(root/'public/LICENSE.txt').write_bytes(files['LICENSE'])
pkg=json.loads((root/'package.json').read_text())
keep=['react','react-dom','@radix-ui/react-slot','@radix-ui/react-icons','class-variance-authority','clsx','tailwind-merge','embla-carousel-react','lucide-react','tailwindcss-animate']
pkg={'name':'yuuzpime-miru-bundle','version':'3.0.0','private':True,'scripts':{'build':'vite build'},'dependencies':{k:pkg['dependencies'][k] for k in keep},'devDependencies':{'vite':'6.4.1','typescript':'^5','tailwindcss':'^3.4.1','postcss':'^8'}}
(root/'package.json').write_text(json.dumps(pkg))
(root/'package-lock.json').unlink(missing_ok=True)
tailwind=root/'tailwind.config.ts'
tailwind.write_text(tailwind.read_text().replace('content: [','content: [\n        "./src/android-main.tsx",'))
for p in ['src/components/hero-section.tsx','src/components/anime-card.tsx','src/components/anime-sections.tsx','src/components/featured-collection.tsx','src/components/featured-collection-card.tsx']:
    f=root/p
    s=f.read_text()
    s=s.replace('Stream this breathtaking title on Miru with zero ad interruptions and crisp playback.','Explore anime on YuuZPime.').replace('Watch Now','Details & official sources').replace('HD 1080P','ANIME').replace('#07090e','#101010').replace('#0d121d','#1b1b1b')
    # No heavy colored glow in the Android skin.
    s=re.sub(r'(indigo|violet|cyan|blue|slate)-([0-9]+)',r'neutral-\2',s)
    f.write_text(s)
# Network timeout for the upstream catalog.
f=root/'src/lib/anilist.ts'
s=f.read_text().replace('method: "POST",','method: "POST",\n    signal: AbortSignal.timeout(12000),',1)
f.write_text(s)
print('Verified original Miru source; original UI modules compiled into Android assets.')
