import pytest
import os
import requests
from typing import Generator
from dotenv import load_dotenv

def pytest_configure(config):
    if os.path.exists(os.path.join(os.path.dirname(__file__), '.env')):
        load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
    else:
        load_dotenv()

@pytest.fixture(scope="session")
def api_base_url() -> str:
    """Get the base URL for API testing"""
    return os.getenv("TEST_API_URL", "http://localhost:3000/api")

@pytest.fixture(scope="session")
def auth_headers() -> dict:
    """Get authentication headers for API requests"""
    api_key = os.getenv("TEST_API_KEY")
    if not api_key:
        raise ValueError("TEST_API_KEY environment variable is required")
    return {"Authorization": f"Bearer {api_key}"}