from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL

model = SentenceTransformer(EMBEDDING_MODEL)

def get_embedding(text):
    """
    Generates embedding for a single text string.
    """
    return model.encode(text).tolist()

def get_embeddings(text_list):
    """
    Generates embeddings for a list of text strings.
    """
    return model.encode(text_list).tolist()

if __name__ == "__main__":
    test_text = "This is a test sentence for embedding generation."
    embedding = get_embedding(test_text)
    print(f"Generated embedding of length: {len(embedding)}")
