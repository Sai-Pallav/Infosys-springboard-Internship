import os
from dotenv import load_dotenv

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path)

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")
# New: Hugging Face API Key (for lightweight embeddings)
HF_API_KEY = os.getenv("HF_API_KEY") 

# Using a standard model on HF
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
LLM_MODEL = "llama-3.3-70b-versatile"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
# HF Model Config
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

if not GROQ_API_KEY:
    raise ValueError("CRITICAL ERROR: GROQ_API_KEY is missing from .env file!")

if not MONGODB_URI:
    print("WARNING: MONGODB_URI is not set. Database features will fail.")

print("Configuration loaded successfully.")
