
import time
from google import genai
from config import GEMINI_API_KEY, MAX_RETRIES, RETRY_DELAY

try:
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    print("Listing available models:")
    
    current_delay = RETRY_DELAY
    
    for attempt in range(MAX_RETRIES):
        try:
            # Based on migration, client.models.list() is likely what we want
            for m in client.models.list():
                if "gemini" in m.name:
                     print(f"- {m.name} ({m.display_name})")
            break # Success, exit retry loop
            
        except Exception as e:
            error_str = str(e)
            if attempt == MAX_RETRIES - 1:
                print(f"Error listing models after {MAX_RETRIES} attempts: {e}")
                raise e
                
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                print(f"Rate limit hit. Retrying in {current_delay} seconds...")
                time.sleep(current_delay)
                current_delay *= 2
            else:
                 print(f"Error listing models: {e}")
                 break

except Exception as e:
    print(f"Critical error in list_models: {e}")
