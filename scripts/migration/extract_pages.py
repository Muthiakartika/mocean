"""
Migration tool: turns the saved WordPress/Elementor HTML of each page into a JSON
content file that the Next.js renderer (src/components/elementor) displays.

  pip install beautifulsoup4 lxml
  python scripts/migration/extract_pages.py <folder-with-saved-html> src/content/pages

Each saved file is named like the URL: "pricing.html", "dive-sites__diving-amed.html".

Output per page (src/content/pages/<slug>.json):
  {
    "path": "/pricing/",
    "elementorId": "15840",        # id of the page's original CSS file (post-15840.css)
    "content": [ node, ... ]
  }
  node = {"type": "container", "id", "classes", "children": [node...]}
       | {"type": "<widget type>", "id", "classes", "html", "wrapped": bool}

Widget HTML is cleaned: image/link URLs point to this site, srcset/scripts removed.
Run it again any time the source HTML is re-downloaded; it overwrites the JSON files.
"""
import json
import os
import re
import sys

from bs4 import BeautifulSoup, Comment

SITE = "https://moceanbeachresort.com"
UPLOADS_OLD = SITE + "/wp-content/uploads/"
UPLOADS_NEW = "/images/uploads/"

# Classes added by Elementor's JavaScript at runtime (or lazy-load), not part of the design.
RUNTIME_CLASSES = {"e-lazyloaded", "elementor-invisible", "animated", "fadeInUp"}


def rewrite_url(url: str) -> str:
    url = url.strip()
    if url.startswith(UPLOADS_OLD):
        return UPLOADS_NEW + url[len(UPLOADS_OLD):]
    if url.startswith(SITE + "/") or url == SITE:
        return url[len(SITE):] or "/"
    return url


def clean_html(el) -> str:
    """Clean a widget's inner HTML and return it as a string."""
    for tag in el.find_all(["script", "noscript"]):
        tag.decompose()
    for c in el.find_all(string=lambda t: isinstance(t, Comment)):
        c.extract()
    for tag in el.find_all(True):
        if tag.name == "img":
            # Only the main file of each image was downloaded; next/image-style srcsets are not needed.
            tag.attrs.pop("srcset", None)
            tag.attrs.pop("sizes", None)
            tag.attrs.pop("fetchpriority", None)
        for attr in ("src", "href", "data-src", "poster"):
            if tag.has_attr(attr):
                tag[attr] = rewrite_url(tag[attr])
        if tag.has_attr("style"):
            tag["style"] = re.sub(
                r"url\((['\"]?)(https://moceanbeachresort\.com/wp-content/uploads/[^'\")]+)\1\)",
                lambda m: f"url({m.group(1)}{rewrite_url(m.group(2))}{m.group(1)})",
                tag["style"],
            )
    html = el.decode_contents()
    return re.sub(r"\n\s*\n+", "\n", html).strip()


def class_string(el) -> str:
    return " ".join(c for c in el.get("class", []) if c not in RUNTIME_CLASSES)


def animation_of(el) -> str | None:
    try:
        settings = json.loads(el.get("data-settings") or "{}")
    except json.JSONDecodeError:
        return None
    return settings.get("_animation") or settings.get("animation") or None


def node_for(el) -> dict:
    kind = el.get("data-element_type")
    node_id = el.get("data-id")
    if kind == "container":
        inner = el.find("div", class_="e-con-inner", recursive=False)
        parent = inner if inner is not None else el
        children = [node_for(c) for c in parent.find_all(attrs={"data-element_type": True}, recursive=False)]
        node = {"type": "container", "id": node_id, "classes": class_string(el), "children": children}
    else:
        widget_type = (el.get("data-widget_type") or "unknown.default").rsplit(".", 1)[0]
        container = el.find("div", class_="elementor-widget-container", recursive=False)
        node = {
            "type": widget_type,
            "id": node_id,
            "classes": class_string(el),
            "wrapped": container is not None,
            "html": clean_html(container if container is not None else el),
        }
    animation = animation_of(el)
    if animation:
        node["animation"] = animation
    return node


def main_document(soup):
    """The page's own Elementor document (not the header/footer templates)."""
    docs = [
        d for d in soup.select("[data-elementor-type]")
        if not d.find_parent(["header", "footer"]) and not d.find_parent(attrs={"data-elementor-type": True})
        and d.get("data-elementor-type") in ("wp-page", "wp-post")
    ]
    return max(docs, key=lambda d: len(d.get_text()), default=None)


def path_from_slug(slug: str) -> str:
    return "/" if slug == "home" else "/" + slug.replace("__", "/") + "/"


def main():
    src_dir, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    for name in sorted(os.listdir(src_dir)):
        if not name.endswith(".html"):
            continue
        slug = name[:-5]
        soup = BeautifulSoup(open(os.path.join(src_dir, name), encoding="utf-8"), "lxml")
        doc = main_document(soup)
        # Posts (classic WordPress content) are handled by extract_posts.py.
        if doc is None or doc.get("data-elementor-type") != "wp-page":
            print("skip (not an Elementor page):", slug)
            continue
        nodes = [node_for(c) for c in doc.find_all(attrs={"data-element_type": True}, recursive=False)]
        data = {"path": path_from_slug(slug), "elementorId": doc.get("data-elementor-id"), "content": nodes}
        with open(os.path.join(out_dir, slug + ".json"), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
        print("ok", slug, len(nodes), "sections")


if __name__ == "__main__":
    main()
