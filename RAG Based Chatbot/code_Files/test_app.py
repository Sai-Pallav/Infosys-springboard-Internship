import sys
import os
import unittest
from unittest.mock import MagicMock, patch

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

sys.modules['vector_store'] = MagicMock()
sys.modules['vector_store'].load_faiss_index.return_value = (MagicMock(), [], {})

sys.modules['retrieval'] = MagicMock()
sys.modules['retrieval'].retrieve_chunks.return_value = [
    {"text": "John Doe is a software engineer.", "source": "test", "chunk_id": 1}
]

sys.modules['embeddings'] = MagicMock()
sys.modules['embeddings'].embed_texts.return_value = [[0.1, 0.2]]

from app import app, SESSION_HISTORY
import generation

class TestMilestone3(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        SESSION_HISTORY.clear()

    @patch('generation.client.chat.completions.create')
    def test_multi_turn_conversation(self, mock_create):
        mock_response = MagicMock()
        mock_response.choices[0].message.content = "He is a software engineer."
        mock_create.return_value = mock_response

        response1 = self.client.post('/get_response', json={
            'query': 'Who is John Doe?',
            'session_id': 'test-session-123'
        })
        self.assertEqual(response1.status_code, 200)
        
        self.assertIn('test-session-123', SESSION_HISTORY)
        self.assertEqual(len(SESSION_HISTORY['test-session-123']), 2) # User + Assistant
        self.assertEqual(SESSION_HISTORY['test-session-123'][0]['content'], 'Who is John Doe?')

        mock_response.choices[0].message.content = "He works at TechCorp."
        response2 = self.client.post('/get_response', json={
            'query': 'Where does he work?',
            'session_id': 'test-session-123'
        })

        call_args = mock_create.call_args
        messages = call_args[1]['messages']
        
        user_content = messages[1]['content']
        self.assertIn("Conversation History:", user_content)
        self.assertIn("Who is John Doe?", user_content)
        self.assertIn("He is a software engineer.", user_content)
        
        print("\n✅ Verification Passed: History was correctly passed to the LLM.")

if __name__ == '__main__':
    unittest.main()
