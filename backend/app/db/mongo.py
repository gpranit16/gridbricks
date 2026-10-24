"""
MongoDB Caching and Persistence Layer
Connects to MongoDB Atlas cluster for caching Elexon stream datasets and computed analytics.
Includes graceful fallback caching for high resilience.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import json
from pathlib import Path
from backend.app.config import settings

logger = logging.getLogger(__name__)

# Fallback disk cache directory
FALLBACK_CACHE_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "cache"
FALLBACK_CACHE_DIR.mkdir(parents=True, exist_ok=True)


class MongoDBService:
    def __init__(self):
        self._client = None
        self._db = None
        self._connected = False
        self._memory_cache: Dict[str, Any] = {}

    def connect(self) -> bool:
        """Attempts connection to MongoDB Atlas."""
        if self._connected and self._client is not None:
            return True
        try:
            import pymongo
            self._client = pymongo.MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=8000,
                connectTimeoutMS=8000,
                socketTimeoutMS=8000
            )
            # Ping database to confirm connection
            self._client.admin.command('ping')
            self._db = self._client[settings.DATABASE_NAME]
            self._connected = True
            self._setup_indexes()
            logger.info("Successfully connected to MongoDB Atlas database '%s'", settings.DATABASE_NAME)
            return True
        except Exception as e:
            logger.warning("MongoDB connection unavailable (%s). Operating in local fallback cache mode.", str(e))
            self._connected = False
            return False

    def is_connected(self) -> bool:
        return self._connected

    def _setup_indexes(self):
        """Creates required query indexes if not present."""
        if not self._connected or self._db is None:
            return
        try:
            # FUELHH index on startTime and fuelType
            self._db.elexon_fuelhh.create_index([("startTime", 1), ("fuelType", 1)])
            # WINDFOR index on startTime and publishTime
            self._db.elexon_windfor.create_index([("startTime", 1), ("publishTime", 1)])
            # Analytics cache index
            self._db.analytics_cache.create_index("cache_key", unique=True)
        except Exception as e:
            logger.warning("Failed setting up MongoDB indexes: %s", str(e))

    def save_fuelhh_records(self, records: List[Dict[str, Any]]):
        """Bulk upserts FUELHH actual records."""
        if not records:
            return
        if self._connected and self._db is not None:
            try:
                import pymongo
                operations = [
                    pymongo.UpdateOne(
                        {"startTime": r["startTime"], "fuelType": r.get("fuelType", "WIND")},
                        {"$set": r},
                        upsert=True
                    )
                    for r in records if "startTime" in r
                ]
                if operations:
                    self._db.elexon_fuelhh.bulk_write(operations, ordered=False)
                return
            except Exception as e:
                logger.warning("MongoDB save_fuelhh_records failed: %s", str(e))
        
        # Local fallback cache
        cache_file = FALLBACK_CACHE_DIR / "fuelhh_cache.json"
        try:
            existing = {}
            if cache_file.exists():
                with open(cache_file, "r", encoding="utf-8") as f:
                    existing = json.load(f)
            for r in records:
                k = f"{r.get('startTime')}_{r.get('fuelType', 'WIND')}"
                existing[k] = r
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(existing, f)
        except Exception as e:
            logger.error("Fallback file cache save failed for FUELHH: %s", str(e))

    def get_fuelhh_records(self, start_time_from: str, start_time_to: str) -> List[Dict[str, Any]]:
        """Retrieves cached FUELHH wind generation records."""
        if self._connected and self._db is not None:
            try:
                cursor = self._db.elexon_fuelhh.find({
                    "fuelType": "WIND",
                    "startTime": {"$gte": start_time_from, "$lte": start_time_to}
                }, {"_id": 0})
                return list(cursor)
            except Exception as e:
                logger.warning("MongoDB get_fuelhh_records query failed: %s", str(e))

        cache_file = FALLBACK_CACHE_DIR / "fuelhh_cache.json"
        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return [
                    v for v in data.values()
                    if v.get("fuelType") == "WIND" and start_time_from <= v.get("startTime", "") <= start_time_to
                ]
            except Exception:
                pass
        return []

    def save_windfor_records(self, records: List[Dict[str, Any]]):
        """Bulk upserts WINDFOR forecast records."""
        if not records:
            return
        if self._connected and self._db is not None:
            try:
                import pymongo
                operations = [
                    pymongo.UpdateOne(
                        {"startTime": r["startTime"], "publishTime": r["publishTime"]},
                        {"$set": r},
                        upsert=True
                    )
                    for r in records if "startTime" in r and "publishTime" in r
                ]
                if operations:
                    self._db.elexon_windfor.bulk_write(operations, ordered=False)
                return
            except Exception as e:
                logger.warning("MongoDB save_windfor_records failed: %s", str(e))

        # Local fallback cache
        cache_file = FALLBACK_CACHE_DIR / "windfor_cache.json"
        try:
            existing = {}
            if cache_file.exists():
                with open(cache_file, "r", encoding="utf-8") as f:
                    existing = json.load(f)
            for r in records:
                k = f"{r.get('startTime')}_{r.get('publishTime')}"
                existing[k] = r
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(existing, f)
        except Exception as e:
            logger.error("Fallback file cache save failed for WINDFOR: %s", str(e))

    def get_windfor_records(self, publish_time_from: str, publish_time_to: str) -> List[Dict[str, Any]]:
        """Retrieves cached WINDFOR forecast records."""
        if self._connected and self._db is not None:
            try:
                cursor = self._db.elexon_windfor.find({
                    "publishTime": {"$gte": publish_time_from, "$lte": publish_time_to}
                }, {"_id": 0})
                return list(cursor)
            except Exception as e:
                logger.warning("MongoDB get_windfor_records query failed: %s", str(e))

        cache_file = FALLBACK_CACHE_DIR / "windfor_cache.json"
        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return [
                    v for v in data.values()
                    if publish_time_from <= v.get("publishTime", "") <= publish_time_to
                ]
            except Exception:
                pass
        return []

    def get_analytics_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Retrieves cached analytical calculations."""
        if self._connected and self._db is not None:
            try:
                doc = self._db.analytics_cache.find_one({"cache_key": cache_key}, {"_id": 0})
                if doc:
                    return doc.get("data")
            except Exception as e:
                logger.warning("MongoDB cache fetch error: %s", str(e))
        return self._memory_cache.get(cache_key)

    def set_analytics_cache(self, cache_key: str, data: Dict[str, Any]):
        """Caches analytical calculation results."""
        self._memory_cache[cache_key] = data
        if self._connected and self._db is not None:
            try:
                self._db.analytics_cache.update_one(
                    {"cache_key": cache_key},
                    {"$set": {"cache_key": cache_key, "data": data, "updated_at": datetime.now(timezone.utc).isoformat()}},
                    upsert=True
                )
            except Exception as e:
                logger.warning("MongoDB cache save error: %s", str(e))


mongo_service = MongoDBService()
