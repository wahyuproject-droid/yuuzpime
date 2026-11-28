# Catalog preservation

Original: Kitsune-master.zip, revision c7fa855304c3c198f9b9a366e5006989d0535fad.

The ten original catalog routes (filter, info, popular, recent, schedule, search, spotlight, suggestions, trending, upcoming) and original AniList client are preserved byte-for-byte. The episode endpoint exposes AniList metadata, not playable streams, and the guest client consumes that metadata without fabricating a 12-episode fallback. Original episode query implementation remains under reference/kitsune/.

Original watch/map/proxy/provider code is retained as reference/source; unverified streaming extraction and unrestricted proxy remain disabled. The UI, branding and guest mode are separate from the catalog.
