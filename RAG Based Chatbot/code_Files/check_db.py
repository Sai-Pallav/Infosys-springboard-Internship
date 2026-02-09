import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env from parent dir
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path)

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    print("Error: MONGODB_URI not found.")
    exit(1)

try:
    client = MongoClient(MONGODB_URI)
    db = client['rag_chatbot']
    collection = db['documents']
    count = collection.count_documents({})
    print(f"Document Count: {count}")
    
    if count > 0:
        sample = collection.find_one()
        print(f"Sample Document: {sample.keys()}")
except Exception as e:
    print(f"Connection Error: {e}")
