"""
Migration tool: turns the saved HTML of each blog post into a JSON content file
for src/components/elementor/PostPage.tsx.

  python scripts/migration/extract_posts.py <folder-with-saved-html> src/content/posts

A post on the original site is:
  1. a banner (Elementor template 12031: background photo + post title), and
  2. the classic WordPress article: featured image + Gutenberg content, which may
     embed Elementor templates (e.g. FAQ accordions) that have their own CSS file.

Output per post (src/content/posts/<slug>.json):
  { "path", "bannerId": "12031", "banner": [node...],
    "articleClasses", "featuredImage": {src, alt, width, height} | null,
    "html", "embeddedElementorIds": ["17778", ...] }
"""
import json
import os
import sys

from bs4 import BeautifulSoup

sys.path.insert(0, os.path.dirname(__file__))
from extract_pages import clean_html, node_for, path_from_slug, rewrite_url  # noqa: E402

BANNER_ID = "12031"


def main():
    src_dir, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    for name in sorted(os.listdir(src_dir)):
        if not name.endswith(".html"):
            continue
        slug = name[:-5]
        soup = BeautifulSoup(open(os.path.join(src_dir, name), encoding="utf-8"), "lxml")
        banner_doc = soup.find(attrs={"data-elementor-id": BANNER_ID})
        article = soup.select_one(".reactheme-blog-details article")
        if banner_doc is None or article is None:
            continue

        banner = [node_for(c) for c in banner_doc.find_all(attrs={"data-element_type": True}, recursive=False)]

        featured = None
        img = article.select_one(".bs-img img")
        if img is not None:
            featured = {
                "src": rewrite_url(img.get("src", "")),
                "alt": img.get("alt", ""),
                "width": int(img.get("width") or 0),
                "height": int(img.get("height") or 0),
            }

        body = article.select_one(".bs-desc")
        embedded = sorted({d["data-elementor-id"] for d in body.select("[data-elementor-id]")})
        # Mark animated elements the same way the page renderer does.
        for el in body.select("[data-settings]"):
            animation = json.loads(el["data-settings"]).get("_animation")
            if animation:
                el["data-animation"] = animation
                el["class"] = el.get("class", []) + ["elementor-invisible"]

        data = {
            "path": path_from_slug(slug),
            "bannerId": BANNER_ID,
            "banner": banner,
            "articleClasses": " ".join(article.get("class", [])),
            "featuredImage": featured,
            "html": clean_html(body),
            "embeddedElementorIds": embedded,
        }
        with open(os.path.join(out_dir, slug + ".json"), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
        print("ok", slug, "embedded:", embedded)


if __name__ == "__main__":
    main()
