import os
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

def clear_database():
    root_dir = Path(__file__).parent
    load_dotenv(root_dir / ".env")

    mongo_url = os.environ.get("MONGO_URL", "mongodb://127.0.0.1:27017")
    db_name = os.environ.get("DB_NAME", "shadow_nexus")

    print(f"Connecting to MongoDB at: {mongo_url}")
    print(f"Target Database: {db_name}")

    client = MongoClient(mongo_url)
    db = client[db_name]

    collections_to_clear = [
        "users",
        "characters",
        "hack_sessions",
        "npc_conversations",
        "messages",
        "password_resets"
    ]

    print("\n--- Starting Wiping Process ---")
    for coll_name in collections_to_clear:
        coll = db[coll_name]
        try:
            count = coll.count_documents({})
            if count > 0:
                result = coll.delete_many({})
                print(f"Wiped collection '{coll_name}': Deleted {result.deleted_count} documents.")
            else:
                print(f"Collection '{coll_name}' is already empty.")
        except Exception as e:
            print(f"Error clearing collection '{coll_name}': {e}")
            
    print("\nDatabase cleanup complete. All previous operatives have been deleted.")

if __name__ == "__main__":
    clear_database()
