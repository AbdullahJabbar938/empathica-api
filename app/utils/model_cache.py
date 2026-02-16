# ai-service/app/utils/model_cache.py
import redis
import json
import hashlib
import os

# Optional Redis cache for performance
REDIS_URL = os.getenv("REDIS_URL", None)

if REDIS_URL:
    redis_client = redis.from_url(REDIS_URL)
else:
    redis_client = None

def get_cached_result(text: str):
    """Get cached emotion analysis result"""
    if not redis_client:
        return None
    
    key = hashlib.md5(text.encode()).hexdigest()
    cached = redis_client.get(f"emotion:{key}")
    
    if cached:
        return json.loads(cached)
    return None

def cache_result(text: str, result: dict, ttl=3600):
    """Cache emotion analysis result"""
    if not redis_client:
        return
    
    key = hashlib.md5(text.encode()).hexdigest()
    redis_client.setex(f"emotion:{key}", ttl, json.dumps(result))