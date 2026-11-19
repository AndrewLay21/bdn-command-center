"""Re-create data/records.json from the recovered records spreadsheet. Usage: python3 scripts/xlsx-to-json.py [path.xlsx]"""
import json, sys
import openpyxl

src = sys.argv[1] if len(sys.argv) > 1 else "data/command-center-records-2026-11-18.xlsx"
wb = openpyxl.load_workbook(src, read_only=True)
out = {}
for ws in wb.worksheets:
    rows = list(ws.iter_rows(values_only=True))
    header = rows[4]
    recs = []
    for r in rows[5:]:
        if not r or r[0] is None:
            continue
        d = {}
        for k, v in zip(header, r):
            if k is None:
                continue
            if isinstance(v, str) and v.startswith("ISO: "):
                v = v[5:]
            if v in ("True", "False"):
                v = v == "True"
            d[k] = v if v is None or isinstance(v, (str, bool, int, float)) else str(v)
        recs.append(d)
    out[ws.title.lower()] = recs
    print(ws.title, len(recs))
json.dump({"source": src, "recoveredAt": "2026-11-18T15:42:00Z", **out}, open("data/records.json", "w"), indent=1, ensure_ascii=False)
