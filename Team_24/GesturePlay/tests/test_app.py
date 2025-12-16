# tests/test_app.py
import os
import sys
import pytest

# Ensure repo root is on sys.path so "from app import app" works in CI
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from app import app  # now this should succeed in CI and locally

@pytest.fixture
def client():
    app.testing = True
    with app.test_client() as client:
        yield client

def test_homepage(client):
    res = client.get("/")
    assert res.status_code == 200
