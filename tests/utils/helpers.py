from typing import Optional, Dict, Any
import requests

class ShortenerAPI:
    def __init__(self, base_url: str, headers: Dict[str, str]):
        self.base_url = f"{base_url}/shortener"
        self.headers = headers

    def create_shortlink(self, url: str, title: Optional[str] = None, 
                        expires_in: Optional[int] = None, 
                        public: bool = False) -> Dict[str, Any]:
        payload = {
            "originalUrl": url,
            "title": title,
            "expiresIn": str(expires_in) if expires_in else None,
            "public": public
        }
        response = requests.post(
            self.base_url,
            headers=self.headers,
            json={k: v for k, v in payload.items() if v is not None}
        )
        return response.json(), response.status_code

    def get_shortlinks(self) -> Dict[str, Any]:
        response = requests.get(self.base_url, headers=self.headers)
        return response.json(), response.status_code

    def get_shortlink(self, shortlink_id: str) -> Dict[str, Any]:
        response = requests.get(
            f"{self.base_url}/{shortlink_id}",
            headers=self.headers
        )
        return response.json(), response.status_code