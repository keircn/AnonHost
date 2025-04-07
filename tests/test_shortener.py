import pytest
from tests.utils.helpers import ShortenerAPI

@pytest.fixture
def shortener_api(api_base_url, auth_headers):
    return ShortenerAPI(api_base_url, auth_headers)

class TestShortenerAPI:
    def test_create_valid_shortlink(self, shortener_api):
        data, status_code = shortener_api.create_shortlink(
            url="https://example.com",
            title="Test Link"
        )
        
        assert status_code == 200
        assert "id" in data
        assert data["originalUrl"] == "https://example.com"
        assert data["title"] == "Test Link"
        assert "shortUrl" in data

    def test_create_invalid_url(self, shortener_api):
        data, status_code = shortener_api.create_shortlink(
            url="not-a-valid-url"
        )
        
        assert status_code == 400
        assert data["error"] == "Invalid URL format"

    def test_create_without_url(self, shortener_api):
        data, status_code = shortener_api.create_shortlink(
            url=""
        )
        
        assert status_code == 400
        assert data["error"] == "Original URL is required"

    def test_create_with_expiration(self, shortener_api):
        data, status_code = shortener_api.create_shortlink(
            url="https://example.com",
            expires_in=7
        )
        
        assert status_code == 200
        assert "expireAt" in data
        assert data["expireAt"] is not None

    def test_get_shortlinks(self, shortener_api):
        data, status_code = shortener_api.get_shortlinks()
        
        assert status_code == 200
        assert "shortlinks" in data
        assert "count" in data
        assert isinstance(data["shortlinks"], list)

    @pytest.mark.parametrize("protocol", [
        "ftp://example.com",
        "ws://example.com",
        "file://example.com"
    ])
    def test_invalid_protocols(self, shortener_api, protocol):
        data, status_code = shortener_api.create_shortlink(url=protocol)
        
        assert status_code == 400
        assert data["error"] == "URL must use HTTP or HTTPS protocol"