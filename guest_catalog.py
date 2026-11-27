from functools import lru_cache
from html import unescape
from time import time
from urllib.parse import urlsplit
import re

import requests
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16384
API = "https://graphql.anilist.co"
FIELDS = """
id title { romaji english } coverImage { large medium }
bannerImage episodes format status seasonYear averageScore
genres description(asHtml: false) isAdult
"""
HOME_QUERY = """query($page:Int) {
 popular: Page(page:$page, perPage:16) {
  media(type:ANIME,isAdult:false,sort:POPULARITY_DESC) { %s }
 }
 recent: Page(page:$page, perPage:16) {
  media(type:ANIME,isAdult:false,status:RELEASING,sort:TRENDING_DESC) { %s }
 }
}""" % (FIELDS, FIELDS)
SEARCH_QUERY = """query($q:String,$page:Int) {
 Page(page:$page,perPage:24) {
  pageInfo { hasNextPage }
  media(type:ANIME,isAdult:false,search:$q,sort:SEARCH_MATCH) { %s }
 }
}""" % FIELDS
DETAIL_QUERY = """query($id:Int) {
 Media(id:$id,type:ANIME,isAdult:false) {
  %s externalLinks { site url type }
 }
}""" % FIELDS

@lru_cache(maxsize=128)
def fetch(query, variables, bucket):
    response = requests.post(API, json={"query": query, "variables": dict(variables)},
                             headers={"Accept": "application/json"}, timeout=(3, 7))
    response.raise_for_status()
    payload = response.json()
    if payload.get("errors") or not isinstance(payload.get("data"), dict):
        raise ValueError("AniList request failed")
    return payload["data"]

def catalog(query, **variables):
    try:
        return fetch(query, tuple(sorted(variables.items())), int(time() // 300)), False
    except (requests.RequestException, ValueError, TypeError):
        app.logger.warning("Catalog API temporarily unavailable")
        return {}, True

def entries(data, key):
    return [x for x in (data.get(key) or {}).get("media", [])
            if isinstance(x, dict) and x.get("isAdult") is False]

def page_number():
    return max(1, min(request.args.get("page", 1, type=int), 100))

@app.template_filter("anime_title")
def anime_title(item):
    titles = item.get("title") or {}
    return titles.get("english") or titles.get("romaji") or "Anime"

@app.template_filter("safe_image")
def safe_image(value):
    try:
        if urlsplit(value or "").scheme == "https":
            return value
    except ValueError:
        pass
    return "/static/img/cover.jpg"

@app.template_filter("plain_description")
def plain_description(value):
    return unescape(re.sub(r"<[^>]*>", " ", value or "")).strip()

@app.route("/")
def home():
    page = page_number()
    data, unavailable = catalog(HOME_QUERY, page=page)
    popular = entries(data, "popular")
    recent = entries(data, "recent")
    return render_template("guest_home.html", popular=popular, recent=recent,
                           unavailable=unavailable, page=page, mode="home")

@app.route("/search")
def search():
    query = request.args.get("query", "").strip()[:100]
    page = page_number()
    data, unavailable = catalog(SEARCH_QUERY, q=query, page=page) if query else ({}, False)
    info = (data.get("Page") or {}).get("pageInfo") or {}
    return render_template("catalog.html", results=entries(data, "Page"), query=query,
                           unavailable=unavailable, page=page, next_page=info.get("hasNextPage"),
                           mode="search")

@app.route("/anime/<int:media_id>")
def detail(media_id):
    data, unavailable = catalog(DETAIL_QUERY, id=media_id)
    item = data.get("Media")
    if not item or item.get("isAdult") is not False:
        return render_template("catalog.html", mode="missing", unavailable=unavailable), 503 if unavailable else 404
    # Only recognized official streaming platforms; never fetch or proxy arbitrary URLs.
    approved = {"crunchyroll.com", "netflix.com", "hidive.com", "disneyplus.com",
                "primevideo.com", "bilibili.tv", "iq.com", "wetv.vip"}
    links = []
    for link in item.get("externalLinks") or []:
        try:
            parsed = urlsplit(link.get("url") or "")
            host = parsed.hostname or ""
            if link.get("type") == "STREAMING" and parsed.scheme == "https" and not parsed.username and any(
                host == domain or host.endswith("." + domain) for domain in approved):
                links.append(link)
        except (ValueError, TypeError):
            continue
    return render_template("catalog.html", item=item, links=links, mode="detail")

@app.route("/healthz")
def health():
    return jsonify(status="ok", app="YuuZPime", mode="guest")

@app.errorhandler(404)
def not_found(_error):
    return render_template("catalog.html", mode="missing"), 404

if __name__ == "__main__":
    app.run()
