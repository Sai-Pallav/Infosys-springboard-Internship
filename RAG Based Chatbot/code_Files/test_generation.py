import os
from unittest.mock import MagicMock, patch
import sys
sys.stdout.reconfigure(encoding='utf-8')


from generation import generate_answer

def test_generation_mock():
    print("Testing generate_answer with MOCK...")
    
    
    with patch('generation.OpenAI') as mock_openai, \
         patch('generation.GROQ_API_KEY', 'mock-key-123'), \
         patch('generation.retrieve_chunks') as mock_retrieve:
        
        mock_retrieve.return_value = [
            {'text': 'Text 1', 'source': 'doc1.txt', 'chunk_id': 1, 'similarity_score': 0.1},
            {'text': 'Text 2', 'source': 'doc2.pdf', 'chunk_id': 5, 'similarity_score': 0.2}
        ]

        mock_client = MagicMock()
        mock_completion = MagicMock()
        mock_completion.choices = [MagicMock(message=MagicMock(content="This is a mocked answer."))]
        
        mock_client.chat.completions.create.return_value = mock_completion
        mock_openai.return_value = mock_client
        
        query = "Who is the Missile Man?"
        answer = generate_answer(query)
        
        print(f"Query: {query}")
        print(f"Result:\n{answer}")
        
        expected_source_1 = "- doc1.txt (chunk 1)"
        expected_source_2 = "- doc2.pdf (chunk 5)"
        
        if "mocked answer" in answer and "Sources:" in answer and expected_source_1 in answer and expected_source_2 in answer:
            print("✅ Citation Test Passed")
        else:
            print("❌ Citation Test Failed")
            print("Expected content not found.")

if __name__ == "__main__":
    test_generation_mock()
