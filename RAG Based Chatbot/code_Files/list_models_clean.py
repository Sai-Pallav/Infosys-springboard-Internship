
from google import genai
from config import GEMINI_API_KEY
import sys

# Redirect stdout to a file to ensure we capture clean output
with open('available_models_clean.txt', 'w') as f:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        f.write("Fetching models...\n")
        
        # client.models.list() returns an iterator
        for m in client.models.list():
            # We want to see the 'name' and 'display_name'
            # The object structure might vary, so let's try to be safe
            name = getattr(m, 'name', 'Unknown Name')
            display_name = getattr(m, 'display_name', 'Unknown Display Name')
            supported_methods = getattr(m, 'supported_generation_methods', [])
            
            f.write(f"Model: {name}\n")
            f.write(f"  Display Name: {display_name}\n")
            f.write(f"  Methods: {supported_methods}\n")
            f.write("-" * 20 + "\n")
            
        f.write("Done.\n")
    except Exception as e:
        f.write(f"Error: {e}\n")
