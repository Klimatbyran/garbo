import json
from pathlib import Path

doc_id = "5ee1f2b6-a86a-4f26-86bc-2223c937528b"
out_dir = Path(f"/tmp/pdf2markdown/{doc_id}")


def without_keys(d: dict, keys: set):
    return {x: d[x] for x in d if x not in keys}


def main():
    with (out_dir / "parsed.json").open("r", encoding="utf-8") as fp:
        doc: dict = json.load(fp)

    wanted_page_nums = {2, 8, 31, 32, 39, 40}
    print(sorted(wanted_page_nums))
    updated_pages = {}

    for page_no, page in doc["pages"].items():
        updated_pages[page_no] = (
            page if int(page_no) in wanted_page_nums else without_keys(page, {"image"})
        )

    doc["pages"] = updated_pages

    with (out_dir / "filtered_images.json").open("w", encoding="utf-8") as fp:
        json.dump(doc, fp)


main()
