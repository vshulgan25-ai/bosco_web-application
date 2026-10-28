"""Допоміжні функції: транслітерація імен для логінів і підготовка фото."""
import io
import re

_MAP = {
    "а": "a", "б": "b", "в": "v", "г": "h", "ґ": "g", "д": "d", "е": "e", "є": "ie", "ж": "zh",
    "з": "z", "и": "y", "і": "i", "ї": "i", "й": "i", "к": "k", "л": "l", "м": "m", "н": "n",
    "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "kh", "ц": "ts",
    "ч": "ch", "ш": "sh", "щ": "shch", "ь": "", "ю": "iu", "я": "ia",
}
_START = {"є": "ye", "ї": "yi", "й": "y", "ю": "yu", "я": "ya"}


def translit(text: str) -> str:
    out = []
    for word in re.split(r"[\s\-]+", text.lower()):
        for i, ch in enumerate(word):
            if ch in "'’ʼ`":
                continue
            out.append(_START[ch] if (i == 0 and ch in _START) else _MAP.get(ch, ch if ch.isascii() and ch.isalnum() else ""))
    return "".join(out)


def name_key(name: str) -> str:
    """Ключ для зіставлення ПІП між файлами (регістр, пробіли, апострофи)."""
    s = re.sub(r"[’ʼ`]", "'", name or "")
    return " ".join(s.split()).casefold()


def optimize_photo(data: bytes, max_side: int = 600) -> bytes:
    from PIL import Image, ImageOps

    img = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
    img.thumbnail((max_side, max_side))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=85, optimize=True)
    return buf.getvalue()


_GROUP_RE = re.compile(r"^(?P<prefix>[^\d\-]+?)\s*-?\s*1(?P<digit>\d)$")


def promote_group(group: str) -> str:
    """ІТ-11 -> ІТ-21, К-11 -> К-21, А-12 -> А-22. Групи, що вже починаються з 2, не змінюються."""
    g = " ".join((group or "").split())
    m = _GROUP_RE.match(g)
    return f"{m.group('prefix')}-2{m.group('digit')}" if m else g
