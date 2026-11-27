import hashlib, json, zipfile, pathlib, sys

def fingerprint(files):
    h=hashlib.sha256()
    for path,data in sorted(files.items()):
        h.update(path.encode()+b'\0'+hashlib.sha256(data).digest())
    return h.hexdigest()

with zipfile.ZipFile(sys.argv[1]) as z:
    files={n.split('/',1)[1]:z.read(n) for n in z.namelist() if not n.endswith('/')}
assert fingerprint(files)=='d1b7b726e02cda63c6cc4c5a5d98095fdece3696a4b1e0e7e02a2501cdb2abc8', 'Original ZIP mismatch'
def replace(path,old,new):
    assert old.encode() in files[path],path
    files[path]=files[path].replace(old.encode(),new.encode(),1)
package=json.loads(files['package.json'])
package['name']='yuuzpime'
package['scripts']['build']='next build'
package['dependencies'].update(next='15.5.29',react='~19.1.10',**{'react-dom':'~19.1.10'})
package['devDependencies']['eslint-config-next']='15.5.29'
package['engines']={'node':'22.x'}
files['package.json']=(json.dumps(package,indent=2,ensure_ascii=False)+'\n').encode()
replace('src/components/layout/Footer/Footer.tsx','https://github.com/notwindstone/anisun/tree/${currentGitCommitHash}','https://github.com/wahyuproject-droid/yuuzpime/tree/${currentGitCommitHash}')
replace('src/components/layout/Footer/Footer.tsx','anime.tatar','yuuzpime.vercel.app')
replace('src/components/layout/Footer/Footer.tsx','{footerItems.description}','{footerItems.description}\n                        <div className="mt-3 text-sm">Modifikasi: YuuZGilakPrompt · <a href="https://sociabuzz.com/yuuzdisini" target="_blank" rel="noopener noreferrer" className="underline">SociaBuzz</a></div>\n                        <div className="mt-1 text-xs">Based on Anisun by notwindstone · <a className="underline" href="https://github.com/wahyuproject-droid/yuuzpime/blob/anisun-yuuzpime/LICENSE">GPL-3.0</a> · No warranty</div>')
replace('src/constants/app.ts','export const AppName = "Anisun";','export const AppName = "YuuZPime";')
replace('src/constants/configs.ts','accent: "rose",','accent: "neutral",')
replace('src/constants/tailwind.ts','export const AccentColors: Array<AccentColorsType> = [\n','export const AccentColors: Array<AccentColorsType> = [\n    "neutral",\n')
for locale,old,new in [('en','Home | Anisun','Home | YuuZPime'),('ru','Главная | Anisun','Главная | YuuZPime'),('uwu','home | anisun','home | YuuZPime')]:
    p=f'src/locales/{locale}.json'
    replace(p,old,new)
    replace(p,'"url": "https://github.com/notwindstone/anisun"','"url": "https://github.com/wahyuproject-droid/yuuzpime/tree/anisun-yuuzpime"')
replace('src/types/TailwindCSS/AccentColors.type.ts','    "red"','    "neutral"\n    | "red"')
files['README.md']=('''# YuuZPime

Rebrand Anisun 5.0.0 (notwindstone), source commit 99a47e013763eb9f306b000ceb3c2df59eade570. Modified by YuuZGilakPrompt (2026-11-28). [SociaBuzz](https://sociabuzz.com/yuuzdisini). Original GPL-3.0 license retained. See docs/README.md for original documentation.

Original application routes, data providers, extension loader, history and account logic are retained. Defaults: neutral monochrome accent. Build configuration uses Node 22 and npm, with updated Next.js security release. Original bun.lockb is retained as an upstream reference; do not use it with frozen-lockfile.

Vercel: Next.js, npm install, npm run build. OAuth variables in .env.example are optional for guest browsing. No video provider or extension is preinstalled by this modification. Use trusted and authorized providers.
''').encode()
files['vercel.json']=(json.dumps({'framework':'nextjs','installCommand':'npm install --no-audit --no-fund','buildCommand':'npm run build'},indent=2)+'\n').encode()
assert len(files)==227
assert fingerprint(files)=='b83bfc93cfec32030b316e7709a97276b8c298668f211519aa60a4e9923428e7', fingerprint(files)
root=pathlib.Path(sys.argv[2])
for name,data in files.items():
    dest=root/name
    assert dest.resolve().is_relative_to(root.resolve())
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_bytes(data)
print('Verified 227 files, matching supplied YuuZPime-Anisun.zip')
