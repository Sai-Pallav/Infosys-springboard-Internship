import sys
import json
from groq import Groq
from config import GROQ_API_KEY, LLM_MODEL

# Initialize Groq Client
client = Groq(apiKey=GROQ_API_KEY)

def generate_answer(query, context):
    """
    Generates an answer using Groq API based on the context.
    """
    try:
        system_prompt = f"You are a helpful assistant. Use the following context to answer the user's question. If the answer is not in the context, say you don't know.\n\nContext:\n{context}"
        
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            model=LLM_MODEL,
        )
        
        return completion.choices[0].message.content
        
    except Exception as e:
        return f"Error generating answer: {str(e)}"

if __name__ == "__main__":
    # CLI Interface for Node.js
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input provided"}))
            sys.exit(1)
            
        data = json.loads(input_data)
        query = data.get("query")
        context = data.get("context", "")
        
        answer = generate_answer(query, context)
        
        print(json.dumps({"answer": answer}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
