import sys
import json
import os
from groq import Groq
from pymongo import MongoClient
from config import GROQ_API_KEY, LLM_MODEL, MONGODB_URI
from retrieval import retrieve_chunks

client = Groq(api_key=GROQ_API_KEY)

mongo_client = MongoClient(MONGODB_URI)
db = mongo_client['rag_chatbot']
collection = db['vectorStore']

def get_all_chunks():
    return list(collection.find({}))

def generate_answer(query, history=[], model=LLM_MODEL, custom_system_prompt=None, active_documents=[]):
    try:
        relevant_chunks = retrieve_chunks(query, active_documents=active_documents)
        
        if not relevant_chunks:
            print("[INFO] No relevant documents found.", file=sys.stderr)
            context_text = "No relevant documents found."
            sources = []
        else:
            context_text = "\n\n".join([chunk.get('text', '') for chunk in relevant_chunks])
            best_score = max([chunk.get('score', 0) for chunk in relevant_chunks])
            
            # User requirement: Don't show sources if they are not truly relevant
            if best_score < 0.6:
                sources = []
                print(f"[INFO] Hiding sources (Best score {best_score:.3f} < 0.6)", file=sys.stderr)
            else:
                sources = list(set([chunk.get('source', 'Unknown') for chunk in relevant_chunks]))

        base_prompt = custom_system_prompt if custom_system_prompt else "You are a helpful assistant."
        system_msg = {
            "role": "system", 
            "content": f"{base_prompt}\n\n"
                       f"CRITICAL RAG RULES:\n"
                       f"1. ONLY use the provided <CONTEXT> to answer. If the <CONTEXT> is about a DIFFERENT subject than the query, say: 'I could not find information about this in your uploaded documents/URLs.'\n"
                       f"2. AT THE VERY END of your response, you MUST provide exactly two metadata lines:\n"
                       f"SOURCE_RELEVANT: [True if the context was used to answer the query, False if not or if subjective mismatch]\n"
                       f"FOLLOWUP: [\"Question 1?\", \"Question 2?\", \"Question 3?\"]\n\n"
                       f"<CONTEXT>\n{context_text}\n</CONTEXT>"
        }
        
        messages = [system_msg]
        
        for msg in history[-10:]: 
            role = "user" if msg.get("role") == "user" else "assistant"
            content = msg.get("content", "")
            if content:
                messages.append({"role": role, "content": content})
        
        messages.append({"role": "user", "content": query})

        max_retries = 3
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                completion = client.chat.completions.create(
                    messages=messages,
                    model=model,
                    stream=True
                )
                
                full_answer = ""
                streaming_active = True
                for chunk in completion:
                    if chunk.choices[0].delta.content:
                        token = chunk.choices[0].delta.content
                        full_answer += token
                        
                        if streaming_active:
                            # Detect markers to stop streaming
                            is_marker = any(m in full_answer for m in ["SOURCE_RELEVANT:", "FOLLOWUP:"])
                            if is_marker:
                                streaming_active = False
                            else:
                                # Stream the token immediately
                                print(json.dumps({"type": "chunk", "text": token}), flush=True)
                
                # Parse relevance and followups
                followups = []
                source_relevant = True
                
                # Robust stripping: Find the first occurrence of any metadata marker
                markers = ["SOURCE_RELEVANT:", "FOLLOWUP:"]
                meta_start = len(full_answer)
                for marker in markers:
                    idx = full_answer.find(marker)
                    if idx != -1 and idx < meta_start:
                        meta_start = idx
                
                answer_text = full_answer[:meta_start].strip()
                
                if "SOURCE_RELEVANT:" in full_answer:
                    relevant_str = full_answer.split("SOURCE_RELEVANT:")[1].split("\n")[0].strip().lower()
                    source_relevant = "true" in relevant_str
                    
                if "FOLLOWUP:" in full_answer:
                    followup_part = full_answer.split("FOLLOWUP:")[1].strip()
                    try:
                        # (Existing parsing logic for followups)
                        if "[" in followup_part and "]" in followup_part:
                            import re
                            match = re.search(r'\[.*\]', followup_part)
                            if match:
                                followups = json.loads(match.group(0))
                    except: pass

                # USER REQUEST: Hide follow-ups if source is false
                if not source_relevant:
                    followups = []

                # Hide sources if the model explicitly says it failed OR if it self-reports as irrelevant
                fallback_phrases = ["i could not find information", "not mentioned in the provided context", "don't have information about that"]
                is_fallback = any(p in answer_text.lower() for p in fallback_phrases)
                
                if is_fallback or not source_relevant:
                    sources = []
                    
                return answer_text, sources, followups
                
            except Exception as api_err:
                if attempt < max_retries - 1:
                    import time
                    print(f"API Error (Attempt {attempt+1}/{max_retries}): {str(api_err)}. Retrying in {retry_delay}s...", file=sys.stderr)
                    time.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    raise api_err
        
    except Exception as e:
        return f"Error generating answer: {str(e)}", [], []

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input provided"}))
            sys.exit(1)
            
        data = json.loads(input_data)
        query = data.get("query")
        history = data.get("history", [])
        model = data.get("model", LLM_MODEL)
        system_prompt = data.get("system_prompt", None)
        active_documents = data.get("active_documents", [])
        
        answer, sources, followups = generate_answer(query, history, model, system_prompt, active_documents)
        
        # Send metadata containing sources and followups
        print(json.dumps({"type": "metadata", "answer": answer, "sources": sources, "followups": followups}), flush=True)
        
    except Exception as e:
        error_msg = str(e)
        print(json.dumps({"type": "error", "error": error_msg}), flush=True)
        sys.exit(1)