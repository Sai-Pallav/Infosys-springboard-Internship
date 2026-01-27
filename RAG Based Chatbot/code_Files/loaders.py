import os
from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    Docx2txtLoader
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FOLDER = os.path.join(BASE_DIR, "data")


def load_documents():
    docs = []

    for file_name in os.listdir(DATA_FOLDER):
        file_path = os.path.join(DATA_FOLDER, file_name)

        if file_name.lower().endswith(".txt"):
            loaded = TextLoader(file_path, encoding='utf-8').load()

        elif file_name.lower().endswith(".pdf"):
            loaded = PyPDFLoader(file_path).load()

        elif file_name.lower().endswith(".docx"):
            loaded = Docx2txtLoader(file_path).load()

        else:
            continue

        for doc in loaded:
            doc.metadata["source_file"] = file_name
            doc.metadata["source_type"] = file_name.split(".")[-1]
            docs.append(doc)

    return docs
