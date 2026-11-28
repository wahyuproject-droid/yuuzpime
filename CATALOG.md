# Kitsune API and data preservation

Source: user-supplied Kitsune-master.zip, exact original 214-file revision c7fa855304c3c198f9b9a366e5006989d0535fad. Archive content digest: f3fc0534e2e729ec82b43956ae6c7f56bf89e2a0541a90526cec0317461b353f.

Audit scope: 98 original files in src/app/api, src/lib, src/types, src/constants, src/query, src/hooks, src/store, src/assets and docs. 90 files are byte-identical to the original at their original paths. All eight modified files have their exact originals preserved as non-executable reference/kitsune/<original path>.txt files.

All ten original catalog endpoints and the AniList module are unchanged. Original provider modules, filters, data schemas, docs/pb.json and src/assets/dmca.json are retained. The live episode route provides AniList metadata. The original Watch, Map, Proxy, Episodes and Health routes and related modified modules are archived; the unverified extraction/proxy functions remain disabled in production and guest authentication remains local. Live provider video content and external databases are not included in the source archive. The complete original ZIP is also contained in the previously published full-source release.

Maintain these original catalog and data files when editing branding, UI or navigation. Do not mistake archived source for active services. Do not overwrite user history or browser storage during cosmetic updates.
