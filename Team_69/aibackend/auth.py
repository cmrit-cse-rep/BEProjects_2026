# from fastapi import Depends, HTTPException, status
# from fastapi.security import OAuth2PasswordBearer
# from jose import jwt
# import requests

# AUTH0_DOMAIN = "dev-uco6t85dzenc0bsd.us.auth0.com"
# API_IDENTIFIER = "https://seed-sync/api"
# ALGORITHMS = ["RS256"]

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# def get_jwk():
#     jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
#     jwks = requests.get(jwks_url).json()
#     return jwks

# def verify_jwt(token: str = Depends(oauth2_scheme)):
#     jwks = get_jwk()
#     try:
#         unverified_header = jwt.get_unverified_header(token)
#         rsa_key = {}
#         for key in jwks["keys"]:
#             if key["kid"] == unverified_header["kid"]:
#                 rsa_key = {
#                     "kty": key["kty"],
#                     "kid": key["kid"],
#                     "use": key["use"],
#                     "n": key["n"],
#                     "e": key["e"]
#                 }
#         if rsa_key:
#             payload = jwt.decode(
#                 token,
#                 rsa_key,
#                 algorithms=ALGORITHMS,
#                 audience=API_IDENTIFIER,
#                 issuer=f"https://{AUTH0_DOMAIN}/"
#             )
#             return payload
#     except Exception:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Could not validate credentials",
#         )


# auth.py
import os
import time
import requests
from typing import Dict, Any, List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from dotenv import load_dotenv
import os

# Load environment variables from the .env file (if present)
load_dotenv()


AUTH0_DOMAIN = os.getenv("VITE_AUTH0_DOMAIN")
API_IDENTIFIER = os.getenv("VITE_API_IDENTIFIER")
ALGORITHMS = ["RS256"]
print(f"AUTH0_DOMAIN: {AUTH0_DOMAIN}, API_IDENTIFIER: {API_IDENTIFIER}")


http_bearer = HTTPBearer(auto_error=True)

# very simple TTL cache for JWKS
_JWKS_CACHE: Dict[str, Any] = {"data": None, "fetched_at": 0, "ttl": 3600}

def _get_jwks() -> Dict[str, Any]:
    now = time.time()
    if not _JWKS_CACHE["data"] or (now - _JWKS_CACHE["fetched_at"] > _JWKS_CACHE["ttl"]):
        jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
        resp = requests.get(jwks_url, timeout=5)
        resp.raise_for_status()
        _JWKS_CACHE["data"] = resp.json()
        _JWKS_CACHE["fetched_at"] = now
    return _JWKS_CACHE["data"]

def _find_rsa_key(token: str) -> Optional[Dict[str, str]]:
    unverified_header = jwt.get_unverified_header(token)
    jwks = _get_jwks()
    for key in jwks.get("keys", []):
        if key.get("kid") == unverified_header.get("kid"):
            return {k: key[k] for k in ("kty", "kid", "use", "n", "e")}
    # kid not found → force JWKS refresh once
    _JWKS_CACHE["data"] = None
    jwks = _get_jwks()
    for key in jwks.get("keys", []):
        if key.get("kid") == unverified_header.get("kid"):
            return {k: key[k] for k in ("kty", "kid", "use", "n", "e")}
    return None



def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(http_bearer)) -> Dict[str, Any]:
    token = credentials.credentials
    rsa_key = _find_rsa_key(token)
    if not rsa_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header (kid not found).",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=API_IDENTIFIER,
            issuer=f"https://{AUTH0_DOMAIN}/"
        )
        return payload  # includes sub, aud, iss, iat, exp, scope, etc.
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Optional scope guard
def require_scopes(required: List[str]):
    def _checker(payload: Dict[str, Any] = Depends(verify_jwt)):
        token_scopes = set((payload.get("scope") or "").split())
        missing = [s for s in required if s not in token_scopes]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required scope(s): {', '.join(missing)}"
            )
        return payload
    return _checker
