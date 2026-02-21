from huggingface_hub import InferenceClient
from config import EMBEDDING_MODEL, HF_API_KEY
import sys
import time

if not HF_API_KEY:
    print("Error: HF_API_KEY is not set. Cannot initialize Hugging Face client.", file=sys.stderr)
    client = None
else:
    client = InferenceClient(api_key=HF_API_KEY)

def get_embedding(text):
    if not client:
        return []
    
    retries = 3
    for attempt in range(retries):
        try:
            # feature_extraction returns a numpy array, we need to convert to list for JSON serialization
            output = client.feature_extraction(text, model=EMBEDDING_MODEL)
            return output.tolist()
        except Exception as e:
            if "503" in str(e) or "Model is loading" in str(e):
                print(f"Model loading, retrying in 10s... (Attempt {attempt + 1}/{retries})", file=sys.stderr)
                time.sleep(10)
            elif attempt < retries - 1:
                print(f"Network error, retrying in 5s... (Attempt {attempt + 1}/{retries})", file=sys.stderr)
                time.sleep(5)
            else:
                raise e
    return []

def get_embeddings(text_list):
    if not client:
        return [[] for _ in text_list]
        
    retries = 3
    for attempt in range(retries):
        try:
            # feature_extraction on a list returns a 2D numpy array
            output = client.feature_extraction(text_list, model=EMBEDDING_MODEL)
            return output.tolist()
        except Exception as e:
            if "503" in str(e) or "Model is loading" in str(e):
                print(f"Model loading, retrying in 10s... (Attempt {attempt + 1}/{retries})", file=sys.stderr)
                time.sleep(10)
            elif attempt < retries - 1:
                print(f"Network error, retrying in 5s... (Attempt {attempt + 1}/{retries})", file=sys.stderr)
                time.sleep(5)
            else:
                raise e
    return [[] for _ in text_list]

if __name__ == "__main__":
    if not HF_API_KEY:
        print("Error: HF_API_KEY is not set. Defaulting to empty list.", file=sys.stderr)
        sys.exit(1)
        
    test_text = "This is a test sentence for embedding generation."
    embedding = get_embedding(test_text)
    print(f"Generated embedding of length: {len(embedding)}")