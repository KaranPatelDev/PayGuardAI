"""Backend tests for iteration-3: OCR invoice parsing + auth/file-type rejection."""
import os
import io
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://invoice-recovery-5.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
TEST_INVOICE_PATH = "/tmp/test_invoice.jpg"
DEMO_EMAIL = os.environ.get("DEMO_EMAIL", "demo@payguard.ai")
DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD", "demo123")


@pytest.fixture(scope="module")
def auth_token():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"login failed: {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


# ============== AUTH check ==============
def test_parse_invoice_requires_auth():
    """No bearer => 401/403."""
    with open(TEST_INVOICE_PATH, "rb") as f:
        files = {"file": ("test.jpg", f, "image/jpeg")}
        r = requests.post(f"{API}/ai/parse-invoice", files=files, timeout=15)
    assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code}: {r.text}"


# ============== Unsupported MIME ==============
def test_parse_invoice_rejects_unsupported_file_type(auth_headers):
    fake = io.BytesIO(b"hello world this is text")
    files = {"file": ("notes.txt", fake, "text/plain")}
    r = requests.post(f"{API}/ai/parse-invoice", headers=auth_headers, files=files, timeout=15)
    assert r.status_code == 400, f"expected 400, got {r.status_code}: {r.text}"
    detail = r.json().get("detail", "")
    assert "Unsupported file type" in detail or "Unsupported" in detail, f"detail: {detail}"


# ============== Happy path: valid JPG => parsed fields ==============
def test_parse_invoice_valid_image_returns_fields(auth_headers):
    assert os.path.exists(TEST_INVOICE_PATH), "test invoice fixture missing"
    with open(TEST_INVOICE_PATH, "rb") as f:
        files = {"file": ("test_invoice.jpg", f, "image/jpeg")}
        r = requests.post(f"{API}/ai/parse-invoice", headers=auth_headers, files=files, timeout=60)
    assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    # _source must be gemini-2.5-pro
    assert data.get("_source") == "gemini-2.5-pro", f"_source: {data.get('_source')}"
    # required keys present (some may be null)
    for key in ("invoice_number", "invoice_date", "due_date", "amount", "tax_amount",
                "total_amount", "customer_business_name", "description"):
        assert key in data, f"missing key {key}; got keys: {list(data.keys())}"
    # At least invoice_number or customer_business_name should be extracted
    assert data.get("invoice_number") or data.get("customer_business_name"), \
        f"OCR failed to extract anything useful: {data}"


# ============== Customer match check (best-effort) ==============
def test_parse_invoice_customer_match_optional(auth_headers):
    """If the test invoice mentions an existing seeded customer (e.g., 'ABC Traders'),
    matched_customer_id should be set. This is best-effort: pass if not present."""
    with open(TEST_INVOICE_PATH, "rb") as f:
        files = {"file": ("test_invoice.jpg", f, "image/jpeg")}
        r = requests.post(f"{API}/ai/parse-invoice", headers=auth_headers, files=files, timeout=60)
    assert r.status_code == 200
    data = r.json()
    name = (data.get("customer_business_name") or "").strip()
    if name:
        # Pull customers list and see if there is a case-insensitive name match
        cl = requests.get(f"{API}/customers", headers=auth_headers, timeout=15)
        assert cl.status_code == 200
        names = {c["business_name"].lower(): c["id"] for c in cl.json()}
        if name.lower() in names:
            assert data.get("matched_customer_id") == names[name.lower()], \
                f"matched_customer_id mismatch: got {data.get('matched_customer_id')}, expected {names[name.lower()]}"
        else:
            # Just informational - skip if customer not in seed
            pytest.skip(f"Extracted customer '{name}' not in seeded customers; matched_customer_id check skipped.")
    else:
        pytest.skip("No customer_business_name extracted; nothing to match.")


# ============== Sanity: existing flows still pass ==============
def test_login_demo_user():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=15)
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_dashboard_summary(auth_headers):
    r = requests.get(f"{API}/dashboard/summary", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    d = r.json()
    for k in ("total_invoiced", "total_pending", "overdue_count", "customer_count", "invoice_count"):
        assert k in d


def test_invoices_list(auth_headers):
    r = requests.get(f"{API}/invoices", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), list)
