import os

# Keep AnimeDex's original application intact; select catalog-only mode if no provider key is configured.
key = os.environ.get("API_KEY", "").strip()
if key and key != "Paste Your Key Here":
    from app import app
else:
    from guest_catalog import app
