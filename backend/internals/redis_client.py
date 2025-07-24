import redis
import os

REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
REDIS_DB = int(os.environ.get('REDIS_DB', 0))

redis_client = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)

def set_key(key, value, ex=None):
    """Set a key in Redis with optional expiry (ex in seconds)."""
    redis_client.set(key, value, ex=ex)

def get_key(key):
    """Get a key from Redis."""
    return redis_client.get(key) 