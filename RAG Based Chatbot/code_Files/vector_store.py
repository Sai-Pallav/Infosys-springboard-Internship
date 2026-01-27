import faiss
import os
import pickle
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
METADATA_PATH = os.path.join(STORAGE_DIR, "metadata.pkl")
FAISS_INDEX_PATH = os.path.join(STORAGE_DIR, "faiss.index")
CHUNKS_PATH = os.path.join(STORAGE_DIR, "chunks.pkl")

def save_faiss_index(embeddings, chunks):
    os.makedirs(STORAGE_DIR, exist_ok=True)
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)
    faiss.write_index(index, FAISS_INDEX_PATH)
    with open(CHUNKS_PATH, "wb") as f:
        pickle.dump(chunks, f)
    metadata = [chunk.metadata for chunk in chunks]
    with open(METADATA_PATH, "wb") as f:
        pickle.dump(metadata, f)
    return index

def load_faiss_index():
    index = faiss.read_index(FAISS_INDEX_PATH)
    with open(CHUNKS_PATH, "rb") as f:
        chunks = pickle.load(f)
    with open(METADATA_PATH, "rb") as f:
        metadata = pickle.load(f)
    return index, chunks, metadata