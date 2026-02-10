import time
import sys
from config import HF_API_KEY, EMBEDDING_MODEL

# Use official Hugging Face Hub library for robust routing
try:
    from huggingface_hub import InferenceClient
except ImportError:
    # Fallback/warning if not installed yet (start_rag.bat should install it)
    InferenceClient = None

def get_embedding(input_data):
    """
    Generates embeddings using the official Hugging Face InferenceClient.
    This automatically handles the new Router migration and works best with Classic tokens.
    """
    if not HF_API_KEY:
         raise ValueError("HF_API_KEY is missing from config!")

    if InferenceClient is None:
         raise ImportError("huggingface-hub not found. Please run start_rag.bat to install dependencies.")

    client = InferenceClient(token=HF_API_KEY)
    
    max_retries = 3
    retry_delay = 1

    for attempt in range(max_retries):
        try:
            # feature_extraction handles both single string and list of strings
            embeddings = client.feature_extraction(
                text=input_data,
                model=EMBEDDING_MODEL
            )
            
            # The client returns a numpy-like list or nested list
            if hasattr(embeddings, "tolist"):
                return embeddings.tolist()
            return embeddings

        except Exception as e:
            error_msg = str(e)
            if "loading" in error_msg.lower() or "503" in error_msg.lower() or "overloaded" in error_msg.lower():
                if attempt < max_retries - 1:
                    print(f"[WARN] HF API Busy/Loading: {error_msg}. Retrying in {retry_delay}s...", file=sys.stderr)
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
            
            if attempt < max_retries - 1:
                print(f"[WARN] Embedding Request Failed: {e}. Retrying...", file=sys.stderr)
                time.sleep(retry_delay)
                retry_delay *= 2
            else:
                print(f"[ERROR] Max Retries Exception: {e}", file=sys.stderr)
                raise e
    
    raise Exception("Max retries reached for Embedding API.")
