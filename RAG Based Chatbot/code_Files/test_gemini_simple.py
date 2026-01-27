import google.generativeai as genai
from config import GEMINI_API_KEY, LLM_MODEL

print(f"Key: {GEMINI_API_KEY[:5]}...")
print(f"Model: {LLM_MODEL}")

try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(LLM_MODEL)
    response = model.generate_content("Hello, can you hear me?")
    print("Response text:")
    print(response.text)
except Exception as e:
    print("Error:")
    print(e)
