# -*- coding: utf-8 -*-
"""Re-cut every research chart into cabinet/reports/plates and write the exhibit."""
import hashlib
import html
import re
from pathlib import Path

import fitz

ROOT = Path("/Volumes/DATA/FIDV/cabinet")
OUT = Path("/Volumes/DATA/FIDV/cabinet/reports/plates")
HTML_PATH = Path("/Volumes/DATA/FIDV/cabinet/reports/FIDV-all-charts.html")
ZOOM = 3.6

HOUSE_ORDER = [
    "UBS",
    "J.P. Morgan",
    "Barclays",
    "Deutsche Bank",
    "Bloomberg Intelligence",
    "其他",
]
HOUSE_ZH = {
    "UBS": "瑞银",
    "J.P. Morgan": "摩根大通",
    "Barclays": "巴克莱",
    "Deutsche Bank": "德意志银行",
    "Bloomberg Intelligence": "彭博行业研究",
    "其他": "其余",
}


def is_name(s):
    if not s or len(s) < 3 or len(s) > 48 or ":" in s:
        return False
    if any(ch.isdigit() for ch in s):
        return False
    low = s.lower()
    if any(tok in low for tok in ("http", "www.", "source", "exclusive use", "see page", "please see", "team")):
        return False
    words = s.replace(",", " ").split()
    return 2 <= len(words) <= 6


def authors_of(doc):
    names = []
    for i in range(min(2, doc.page_count)):
        lines = [ln.strip() for ln in (doc[i].get_text() or "").splitlines() if ln.strip()]
        for j, ln in enumerate(lines):
            hit = ("Analyst" in ln and len(ln) < 42) or ("@" in ln and "exclusive" not in ln.lower())
            if not hit:
                continue
            for k in range(1, 4):
                if j - k < 0:
                    break
                cand = lines[j - k].replace(" AC", "").strip()
                if "analyst" in cand.lower():
                    continue
                if is_name(cand):
                    names.append(cand)
                    break
    out = []
    for n in names:
        if n not in out:
            out.append(n)
    return out[:4]


def house_of(doc, path):
    blob = ""
    for i in range(min(2, doc.page_count)):
        blob += (doc[i].get_text() or "")[:2500]
    name = path.name
    folder = str(path)
    if "/BB_Research_Docs_Commitments/" in folder and "/BB_Research_Docs_Commitments_2/" not in folder:
        return "Bloomberg Intelligence"
    if "Deutsche Bank" in blob or name.startswith("Deutsche"):
        return "Deutsche Bank"
    if "Barclays" in blob or "Barclays_" in name:
        return "Barclays"
    if "J.P. Morgan" in blob or "J P M O R G A N" in blob or "JP_Morgan" in name or "JPMorgan" in blob:
        return "J.P. Morgan"
    if "UBS" in blob or "_UBS_" in name:
        return "UBS"
    return "其他"


def date_of(path):
    m = re.search(r"(20\d{2})(\d{2})(\d{2})", path.name)
    if not m:
        return ""
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"


def title_of(path):
    stem = path.stem
    stem = re.sub(r"^20\d{6}_", "", stem)
    stem = stem.replace("_", " ")
    stem = re.sub(r"\s+", " ", stem).strip()
    return stem[:110]


def lines_of(page):
    rows = []
    d = page.get_text("dict")
    for b in d["blocks"]:
        if b.get("type") != 0:
            continue
        for ln in b["lines"]:
            text = "".join(s["text"] for s in ln["spans"]).strip()
            if text:
                rows.append((fitz.Rect(ln["bbox"]), text))
    return rows


def heading_above(rows, bbox):
    numbered = []
    closest = None
    for rect, text in rows:
        if rect.y1 > bbox.y0 + 1:
            continue
        gap = bbox.y0 - rect.y1
        if gap > 170 or gap < -2:
            continue
        if "exclusive use" in text.lower():
            continue
        if re.match(r"^\d+\.\s+\S", text) and len(text) < 140:
            numbered.append((gap, text))
        if closest is None or gap < closest[0]:
            closest = (gap, text)
    if numbered:
        numbered.sort()
        return numbered[0][1]
    if closest:
        return closest[1][:180]
    return ""


def question_from_title(text):
    text = re.sub(r"^Figure\s+\d+\s*:\s*", "", text).strip()
    text = re.sub(r"^FIGURE\s+\d+\s*:\s*", "", text).strip()
    return text[:200]


def figure_boxes(page):
    rows = lines_of(page)
    titles = []
    for i, (rect, text) in enumerate(rows):
        if text.startswith("Figure ") or text.startswith("FIGURE "):
            title = text
            y1 = rect.y1
            x1 = rect.x1
            y0 = rect.y0
            x0 = rect.x0
            if i + 1 < len(rows):
                nrect, ntext = rows[i + 1]
                if nrect.y0 - rect.y1 < 16 and not ntext.startswith(("Figure", "FIGURE", "Table", "Source")):
                    title = title + " " + ntext
                    y1 = nrect.y1
                    x1 = max(x1, nrect.x1)
            titles.append((fitz.Rect(x0, y0, x1, y1), title))
    boxes = []
    for idx, (title_rect, title) in enumerate(titles):
        next_y = page.rect.y1 - 28
        right_limit = page.rect.x1
        left_limit = page.rect.x0
        for rect, text in titles:
            if rect.y0 > title_rect.y1 + 8 and (
                text.startswith(("Figure ", "FIGURE ", "Table ")) or "exclusive use" in text.lower()
            ):
                next_y = min(next_y, rect.y0 - 3)
            if abs(rect.y0 - title_rect.y0) < 20 and rect.x0 > title_rect.x0 + 8:
                if rect.x0 > title_rect.x1 - 8:
                    right_limit = min(right_limit, rect.x0 - 6)
            if abs(rect.y0 - title_rect.y0) < 20 and rect.x1 < title_rect.x0 - 4:
                left_limit = max(left_limit, rect.x1 + 6)
        box = fitz.Rect(title_rect)
        draw_bottom = title_rect.y1
        for dr in page.get_drawings():
            r = dr["rect"]
            if r.height > page.rect.height * 0.85 and r.width > page.rect.width * 0.85:
                continue
            if r.height < 1.4 and r.width > page.rect.width * 0.7:
                continue
            if r.x1 < title_rect.x0 - 12 or r.x0 > right_limit + 4:
                continue
            if r.y0 >= title_rect.y0 - 6 and r.y1 <= next_y and r.width > 3 and r.height > 2:
                box.include_rect(r)
                draw_bottom = max(draw_bottom, r.y1)
        for im in page.get_image_info():
            r = fitz.Rect(im["bbox"])
            if r.width < 30 or r.height < 20:
                continue
            if r.x1 < title_rect.x0 - 12 or r.x0 > right_limit + 4:
                continue
            if r.y0 >= title_rect.y0 - 8 and r.y1 <= next_y:
                box.include_rect(r)
                draw_bottom = max(draw_bottom, r.y1)
        text_bottom = draw_bottom + 26 if draw_bottom > title_rect.y1 + 30 else next_y
        for rect, text in rows:
            if "exclusive use" in text.lower():
                continue
            if rect.y0 < title_rect.y0 - 2 or rect.y1 > text_bottom:
                continue
            if rect.x0 > right_limit + 4:
                continue
            prose = len(text) > 130 and not any(ch.isdigit() for ch in text)
            if prose:
                continue
            box.include_rect(rect)
        capped_right = right_limit < page.rect.x1 - 1
        capped_left = left_limit > page.rect.x0 + 1
        if capped_right:
            box.x1 = min(box.x1, right_limit)
        if capped_left:
            box.x0 = max(box.x0, left_limit)
        if box.height < 36 or box.width < 80:
            continue
        if not capped_left:
            box.x0 = max(page.rect.x0, box.x0 - 8)
        box.y0 = max(page.rect.y0, box.y0 - 4)
        if not capped_right:
            box.x1 = min(page.rect.x1, box.x1 + 8)
        box.y1 = min(page.rect.y1 - 4, box.y1 + 8)
        boxes.append((box, question_from_title(title)))
    return boxes


def save_unique(store, blob, rec):
    digest = hashlib.md5(blob).hexdigest()
    if digest in store:
        store[digest]["also"].append(rec["source"])
        return False
    rec["also"] = []
    rec["digest"] = digest
    store[digest] = rec
    return True


def main():
    if OUT.exists():
        for p in OUT.rglob("*"):
            if p.is_file():
                p.unlink()
    OUT.mkdir(parents=True, exist_ok=True)
    store = {}
    pdfs = sorted(ROOT.rglob("*.pdf"))
    for pi, path in enumerate(pdfs, 1):
        doc = fitz.open(path)
        house = house_of(doc, path)
        people = "、".join(authors_of(doc)) or HOUSE_ZH.get(house, house)
        date = date_of(path)
        report = title_of(path)
        if house == "Bloomberg Intelligence":
            for pi_page, page in enumerate(doc, 1):
                rows = lines_of(page)
                seen_xref = set()
                for im in page.get_images(full=True):
                    xref = im[0]
                    if xref in seen_xref:
                        continue
                    seen_xref.add(xref)
                    try:
                        rects = page.get_image_rects(xref)
                    except Exception:
                        continue
                    for rect in rects:
                        if rect.width <= 140 or rect.height <= 68 or rect.height / max(rect.width, 1) <= 0.32:
                            continue
                        try:
                            extracted = doc.extract_image(xref)
                        except Exception:
                            continue
                        blob = extracted["image"]
                        if len(blob) < 4000:
                            continue
                        ext = extracted.get("ext") or "png"
                        if ext == "jpeg":
                            ext = "jpg"
                        q = heading_above(rows, rect)
                        q = re.sub(r"^\d+\.\s+", "", q).strip()
                        source = f"{date}　{report}　第{pi_page}页"
                        rec = {
                            "house": house,
                            "author": people,
                            "question": q or "图内标题",
                            "source": source,
                            "date": date,
                            "ext": ext,
                            "blob": blob,
                        }
                        save_unique(store, blob, rec)
        else:
            for pi_page, page in enumerate(doc, 1):
                for box, question in figure_boxes(page):
                    pix = page.get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM), clip=box, alpha=False)
                    if pix.width < 240 or pix.height < 120:
                        continue
                    blob = pix.tobytes("png")
                    source = f"{date}　{report}　第{pi_page}页"
                    rec = {
                        "house": house,
                        "author": people,
                        "question": question or "图内标题",
                        "source": source,
                        "date": date,
                        "ext": "png",
                        "blob": blob,
                    }
                    save_unique(store, blob, rec)
        doc.close()
        if pi % 15 == 0:
            print(f"scanned {pi}/{len(pdfs)} unique {len(store)}", flush=True)
    print("unique", len(store), flush=True)
    by_house = {h: [] for h in HOUSE_ORDER}
    for rec in store.values():
        by_house.setdefault(rec["house"], []).append(rec)
    seq = {h: 0 for h in HOUSE_ORDER}
    for house in HOUSE_ORDER:
        rows = by_house.get(house, [])
        rows.sort(key=lambda r: (r["author"], r["date"], r["source"]))
        folder = OUT / house.replace(" ", "_").replace(".", "")
        folder.mkdir(parents=True, exist_ok=True)
        for rec in rows:
            seq[house] += 1
            name = f"{seq[house]:04d}.{rec['ext']}"
            dest = folder / name
            dest.write_bytes(rec["blob"])
            rec["rel"] = f"plates/{folder.name}/{name}"
            rec["blob"] = None
    parts = []
    parts.append("""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>制图展开</title>
<style>
:root { --ink:#1a1f26; --muted:#4a5560; --rule:#c5ccd4; --paper:#f7f5f0; --fill:#ece8e0; }
@page { size: A4; margin: 14mm 14mm 16mm; }
* { box-sizing: border-box; }
body {
  margin: 0 auto; padding: 16mm 16mm 22mm; max-width: 180mm;
  color: var(--ink); background: var(--paper);
  font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Songti SC", "Noto Serif SC", serif;
  font-size: 11pt; line-height: 1.45;
}
.brand { letter-spacing: 0.07em; font-size: 11pt; margin: 0 0 0.4em; }
h1 { font-size: 18pt; font-weight: 600; letter-spacing: 0.04em; margin: 0 0 0.2em; }
h2 { font-size: 12.5pt; font-weight: 600; border-bottom: 1px solid var(--rule); margin: 1.1em 0 0.6em; page-break-after: avoid; }
.cover-meta { color: var(--muted); font-size: 10pt; margin: 0 0 1em; }
figure { margin: 0 0 1.15em; page-break-inside: avoid; }
img { width: 100%; height: auto; display: block; border: 1px solid var(--rule); }
figcaption { color: var(--muted); font-size: 9.5pt; margin-top: 0.28em; }
.no-print { color: var(--muted); font-size: 9.5pt; margin: 0 0 1em; }
@media print { body { background: white; padding: 0; } .no-print { display: none; } }
</style>
</head>
<body>
<p class="no-print">浏览器打开此页 → 打印 → 存 PDF → 关掉页眉里的网址。</p>
<p class="brand">FIDV</p>
<h1>制图展开</h1>
""")
    total = len(store)
    parts.append(f'<p class="cover-meta">2026-10-09。共 {total} 张。同一张图只印一次。按分析公司分列。德意志银行这份会议纪要没有单独成图。</p>\n')
    for house in HOUSE_ORDER:
        rows = by_house.get(house, [])
        if not rows:
            continue
        parts.append(f"<h2>{html.escape(HOUSE_ZH[house])}　{len(rows)}</h2>\n")
        for rec in rows:
            q = html.escape(rec["question"])
            src = html.escape(rec["source"])
            author = html.escape(rec["author"])
            also = rec["also"]
            extra = ""
            if also:
                extra = f"　同图另见 {len(also)} 处"
            parts.append(
                "<figure>\n"
                f'<img src="{html.escape(rec["rel"])}" alt="">\n'
                f"<figcaption>回答的问题：{q}<br>来源：{src}{extra}<br>作者：{author}</figcaption>\n"
                "</figure>\n"
            )
    parts.append("</body></html>\n")
    HTML_PATH.write_text("".join(parts), encoding="utf-8")
    print("html", HTML_PATH, "charts", total)
    for house in HOUSE_ORDER:
        print(house, len(by_house.get(house, [])))


if __name__ == "__main__":
    main()
