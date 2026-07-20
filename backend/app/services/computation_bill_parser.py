"""
computation_bill_parser.py (fixed)

Two correctness fixes over the previous version, verified against real
Statement of Income PDFs:

1. AMOUNT EXTRACTION NO LONGER BLEEDS ACROSS SECTIONS.
   The old code used `SomeHeader.*?(\d...)` with re.DOTALL, which — when the
   number right after a header didn't match the expected comma-grouped
   format (e.g. a bare "0" for a fully-exempted capital gain) — kept
   scanning forward through the ENTIRE rest of the document until it found
   any matching number, often from a completely unrelated section.
   Fix: search only within a bounded window (default 200 chars) after the
   header, and explicitly accept "0" so a genuine zero doesn't get skipped.

2. BUSINESS INCOME DETECTION NO LONGER FIRES ON LOSS CARRY-FORWARD TABLES.
   "Ordinary business loss" / "speculation business" appear in the Brought
   Forward Losses schedule even when the client has NO business income this
   year (they're set-off entries against past years). The old patterns
   matched those, wrongly billing a "Business / Profession Income" fee for
   people who have none. Fix: patterns now require phrasing that only
   appears when there's a genuine current-year business/profession head of
   income (e.g. "income from business", "profits and gains of business or
   profession", "presumptive income"), not just any mention of the words
   "business" + "loss".
"""

import re
from pathlib import Path
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    import docx
except ImportError:
    docx = None


# ---------------------------------------------------------------------------
# FIXED FEE TABLE — flat rate per category, regardless of count within it.
# ---------------------------------------------------------------------------
FEE_RATES = {
    "salary_income":            {"label": "Salary Income Computation",              "amount": 1500, "base": True,  "category": "salary"},
    "house_property_income":    {"label": "House Property Income Computation",       "amount": 1200, "base": True,  "category": "house_property"},
    "capital_gains":            {"label": "Capital Gains Computation",               "amount": 2500, "base": False, "category": "capital_gains"},
    "other_sources_interest":   {"label": "Interest Income Computation",             "amount": 800,  "base": False, "category": "ifos"},
    "other_sources_dividend":   {"label": "Dividend Income Computation",             "amount": 500,  "base": False, "category": "ifos"},
    "tds_reconciliation":       {"label": "TDS / TCS Reconciliation",                "amount": 700,  "base": False, "category": "tds"},
    "advance_tax":              {"label": "Advance Tax Verification",                "amount": 400,  "base": False, "category": "advance_tax"},
    "brought_forward_losses":   {"label": "Brought Forward / Carry Forward Losses",  "amount": 900,  "base": False, "category": "losses"},
    "refund_or_demand":         {"label": "Refund / Balance Tax Payable Processing", "amount": 500,  "base": False, "category": "refund"},
    "business_income":          {"label": "Business / Profession Income",           "amount": 2000, "base": False, "category": "business"},
    "agricultural_income":      {"label": "Agricultural Income",                     "amount": 600,  "base": False, "category": "agriculture"},
}

DETECTION_PATTERNS = {
    "salary_income": [
        r"income from salaries", r"salaries,\s*allowances and perquisites",
        r"standard deduction u/s 16\(ia\)",
    ],
    "house_property_income": [
        r"income from house property", r"let-?out propert(y|ies)",
        r"gross annual value", r"net annual value",
    ],
    "capital_gains": [
        r"capital gains?", r"long-?term capital gain", r"short-?term capital gain",
        r"\bltcg\b", r"\bstcg\b", r"sale consideration",
    ],
    "other_sources_interest": [
        r"interest income", r"interest on savings", r"interest from deposits",
    ],
    "other_sources_dividend": [
        r"dividends?\s+(taxable|from company)", r"total dividends",
    ],
    "tds_reconciliation": [
        r"tds\s*/\s*tcs", r"tds as per form", r"tds from salaries", r"tds deducted",
    ],
    "advance_tax": [
        r"advance tax paid",
    ],
    "brought_forward_losses": [
        r"brought forward loss", r"unabsorbed loss", r"losses set off",
    ],
    "refund_or_demand": [
        r"refund due", r"balance tax payable", r"total prepaid taxes",
    ],
    # FIX: only match genuine current-year business/profession income, not
    # mere mentions of "business loss" inside a brought-forward-losses table.
    "business_income": [
        r"income from business", r"profits? and gains? of business or profession",
        r"presumptive income", r"business income chargeable", r"profit before tax",
    ],
    "agricultural_income": [
        r"agricultural income", r"net agricultural income",
    ],
}

HEADER_PATTERNS = {
    "client_name": [
        r"Name\s*:?\s*([A-Za-z .]+?)(?:\s+(?:Previous Year|Father|PAN|Aadhaar|Date))",
    ],
    "pan": [
        r"PAN\s*:?\s*([A-Z]{4,5}\s?\d{3,4}\s?[A-Z])",
    ],
    "assessment_year": [
        r"A\.?\s*Y\.?\s*:?\s*(\d{4}-\d{4})",
        r"Previous Year\s*:?\s*(\d{4}-\d{4})",
    ],
    "date_of_birth": [
        r"Date of Birth\s*:?\s*(\d{1,2}-\s*[A-Za-z]{3,9}-\s*\d{4})",
    ],
    "status": [
        r"(Resident\s*-?\s*Senior Citizen|Non-Resident|NRI|Resident|Individual)",
    ],
}

# Proper Indian-format (comma-grouped) amount — e.g. 16,62,567 or 1,800
_AMOUNT_GROUPED = r"(-?\d{1,2},\d{2,3},\d{3}|-?\d{1,3},\d{3})"
# Combined: tries grouped first, falls back to bare, AT EACH POSITION as the
# regex scans left-to-right — so a genuine "0" immediately after a header
# is returned rather than skipped, while a genuine grouped number a few
# characters later is preferred over any bare digit before it.
_AMOUNT_LEFTMOST = r"(-?\d{1,2},\d{2,3},\d{3}|-?\d{1,3},\d{3}|-?\d{1,3})"


def _find_amount_leftmost(text: str, header_pattern: str, window: int = 60) -> Optional[str]:
    """
    For fields where the real value directly follows the header with just
    whitespace (e.g. "Income chargeable under the head Capital gains  0") —
    take the very next number, whatever it is. A short window keeps this
    from wandering into the next section if the header itself has no value
    at all.
    """
    match = re.search(header_pattern, text, re.IGNORECASE)
    if not match:
        return None
    window_text = text[match.end(): match.end() + window]
    amt = re.search(_AMOUNT_LEFTMOST, window_text)
    return amt.group(1) if amt else None


def _find_amount_skip_schedule_no(text: str, header_pattern: str, window: int = 200) -> Optional[str]:
    """
    For fields like "TDS / TCS  5  1,37,820" where a lone 1-2 digit
    "Sch. No." column reference sits between the label and the real amount —
    prefer a properly comma-grouped Indian-format number within the window;
    only fall back to a bare number if no grouped number exists at all.
    """
    match = re.search(header_pattern, text, re.IGNORECASE)
    if not match:
        return None
    window_text = text[match.end(): match.end() + window]
    grouped = re.search(_AMOUNT_GROUPED, window_text)
    if grouped:
        return grouped.group(1)
    bare = re.search(r"(-?\d{1,3})", window_text)
    return bare.group(1) if bare else None


def _extract_text(file_path: str) -> str:
    path = Path(file_path)
    if path.suffix.lower() == ".pdf":
        if pdfplumber is None:
            raise RuntimeError("pdfplumber is required to parse PDF computation bills")
        text_parts = []
        with pdfplumber.open(str(path)) as pdf:
            for page in pdf.pages:
                text_parts.append(page.extract_text() or "")
        return "\n".join(text_parts)
    elif path.suffix.lower() in (".docx", ".doc"):
        if docx is None:
            raise RuntimeError("python-docx is required to parse DOCX computation bills")
        d = docx.Document(str(path))
        return "\n".join(p.text for p in d.paragraphs)
    else:
        raise ValueError(f"Unsupported computation bill file type: {path.suffix}")


def _detect_categories(text: str) -> Dict[str, bool]:
    lowered = text.lower()
    return {
        category: any(re.search(p, lowered, re.IGNORECASE) for p in patterns)
        for category, patterns in DETECTION_PATTERNS.items()
    }


def _extract_header_info(text: str) -> Dict[str, Optional[str]]:
    info = {}
    for key, patterns in HEADER_PATTERNS.items():
        info[key] = None
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                info[key] = re.sub(r"\s+", " ", match.group(1)).strip()
                break
    return info


def _extract_income_amounts(text: str) -> Dict[str, Optional[str]]:
    """
    Field-appropriate extraction: most 'Income chargeable under the head X'
    lines have the value immediately following (use leftmost, accepts a
    genuine 0); TDS has a schedule-number token in between (skip to the
    real grouped amount).
    """
    return {
        "salary": _find_amount_leftmost(text, r"income chargeable under the head[^\n]*?salaries"),
        "house_property": _find_amount_leftmost(text, r"income chargeable under the head[^\n]*?house property"),
        "capital_gains": _find_amount_leftmost(text, r"income chargeable under the head[^\n]*?capital gains"),
        "other_sources": _find_amount_leftmost(text, r"income chargeable under the head[^\n]*?other sources"),
        "total_income": _find_amount_skip_schedule_no(text, r"total income\b"),
        "tax": _find_amount_skip_schedule_no(text, r"tax on total income"),
        "tds": _find_amount_skip_schedule_no(text, r"tds\s*/\s*tcs"),
        "refund": _find_amount_leftmost(text, r"refund due", window=100),
        "balance_tax": _find_amount_leftmost(text, r"balance tax payable", window=100),
    }


def parse_computation_bill(file_path: str, document_name: str = None) -> Dict[str, Any]:
    document_name = document_name or Path(file_path).name
    try:
        text = _extract_text(file_path)
    except Exception as e:
        logger.error(f"Error extracting text: {e}")
        return {"fee_components": [], "detected": {}, "error": str(e), "document_name": document_name}

    detected = _detect_categories(text)
    header_info = _extract_header_info(text)
    income_amounts = _extract_income_amounts(text)

    fee_components = []
    has_base = False

    label_amount_key = {
        "salary_income": "salary",
        "house_property_income": "house_property",
        "capital_gains": "capital_gains",
        "other_sources_interest": "other_sources",
        "tds_reconciliation": "tds",
    }

    for category, is_present in detected.items():
        if not is_present:
            continue
        rate = FEE_RATES.get(category)
        if not rate:
            continue
        if rate.get("base"):
            has_base = True

        amount_extra = ""
        amt_key = label_amount_key.get(category)
        if amt_key and income_amounts.get(amt_key) is not None:
            amount_extra = f" (\u20b9{income_amounts[amt_key]})"
        if category == "refund_or_demand":
            if income_amounts.get("refund"):
                amount_extra = f" (Refund: \u20b9{income_amounts['refund']})"
            elif income_amounts.get("balance_tax"):
                amount_extra = f" (Balance Tax: \u20b9{income_amounts['balance_tax']})"

        fee_components.append({
            "id": f"doc-{category}",
            "document_id": None,
            "document_name": document_name,
            "category": rate["category"],
            "label": rate["label"] + amount_extra,
            "amount": rate["amount"],
            "source": "document",
            "is_base": rate["base"],
            "is_extra": False,
            "detected_from": category,
        })

    if not has_base and fee_components:
        fee_components.append({
            "id": "doc-base-fee", "document_id": None, "document_name": document_name,
            "category": "base", "label": "Base ITR Filing Fee", "amount": 1500,
            "source": "default", "is_base": True, "is_extra": False,
        })

    return {
        "fee_components": fee_components,
        "detected": detected,
        "detected_info": {"categories": detected, "income_amounts": income_amounts, "header": header_info},
        "client_name": header_info.get("client_name"),
        "pan": header_info.get("pan"),
        "assessment_year": header_info.get("assessment_year"),
        "date_of_birth": header_info.get("date_of_birth"),
        "status": header_info.get("status"),
        "total": sum(c["amount"] for c in fee_components),
        "document_name": document_name,
    }


if __name__ == "__main__":
    import json, sys
    for f in sys.argv[1:]:
        print(f"\n=== {f} ===")
        print(json.dumps(parse_computation_bill(f), indent=2, default=str))