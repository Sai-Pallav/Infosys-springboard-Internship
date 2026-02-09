import os
from dotenv import load_dotenv

# Load environment variables
# Load environment variables
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path)
# Debug prints removed to prevent JSON parsing errors in Node.js
# print(f"DEBUG: Loaded .env from {dotenv_path}")
# print(f"DEBUG: MONGODB_URI is {'Set' if os.getenv('MONGODB_URI') else 'Not Set'}")

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
LLM_MODEL = "llama-3.3-70b-versatile"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

if not GROQ_API_KEY:
    print("Warning: GROQ_API_KEY not found in environment variables.")
