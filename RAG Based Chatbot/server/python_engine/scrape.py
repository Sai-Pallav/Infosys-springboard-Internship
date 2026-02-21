import os
import sys
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

# Set a default USER_AGENT to prevent Langchain warnings down the pipeline
os.environ["USER_AGENT"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

# Re-use the ingestion pipeline
from config import MONGODB_URI
from embeddings import get_embeddings
from pymongo import MongoClient
import uuid

def get_domain(url):
    return urlparse(url).netloc

def extract_links(soup, base_url):
    links = set()
    domain = get_domain(base_url)
    for a in soup.find_all('a', href=True):
        href = a['href']
        # Handle relative links
        if href.startswith('/'):
            href = f"https://{domain}{href}"
        # Only keep links from same domain and avoid anchors/files
        if get_domain(href) == domain and not href.endswith(('.pdf', '.png', '.jpg', '.jpeg', '.gif', '.zip', '.tar', '.gz')):
            links.add(href.split('#')[0]) # Strip anchors
    return list(links)

def scrape_single_url(url, headers):
    print(f"Fetching content from: {url}", file=sys.stderr)
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove noisy elements
        for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
            element.decompose()

        # Extract text
        text = soup.get_text(separator='\n\n', strip=True)
        title = soup.title.string if soup.title else url
        
        return text, title, soup
    except Exception as e:
        print(f"Warning: Failed to fetch {url}: {e}", file=sys.stderr)
        return None, None, None

def ingest_url(url, deep_crawl=False):
    try:
        # Validate URL loosely
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("Invalid URL format. Please provide a full URL including http:// or https://")

        print(f"Fetching content from: {url}", file=sys.stderr)
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        urls_to_scrape = [url]
        scraped_urls = set()
        all_text = ""
        main_title = "Web: " + url
        source_name = main_title
        
        if deep_crawl:
            print(f"Deep crawl enabled for {url}", file=sys.stderr)
            main_text, base_title, soup = scrape_single_url(url, headers)
            if main_text:
                all_text += main_text + "\n\n"
                main_title = f"Web (Deep): {base_title}"
                source_name = main_title
                scraped_urls.add(url)
                
                # Extract sublinks
                sublinks = extract_links(soup, url)
                print(f"Found {len(sublinks)} sublinks on the same domain.", file=sys.stderr)
                
                # Crawl up to 5 sublinks for speed
                count = 0
                for link in sublinks:
                    if count >= 5: break
                    if link not in scraped_urls:
                        sub_text, _, _ = scrape_single_url(link, headers)
                        if sub_text:
                            all_text += sub_text + "\n\n"
                            scraped_urls.add(link)
                            count += 1
            else:
                 raise ValueError(f"Failed to fetch base URL {url}")
        else:
            # Single page scrape
            main_text, base_title, _ = scrape_single_url(url, headers)
            if main_text:
                all_text = main_text
                main_title = f"Web: {base_title}"
                source_name = main_title
                scraped_urls.add(url)
            else:
                 raise ValueError(f"Failed to fetch URL {url}")
        
        text = all_text
        
        if not text or len(text.strip()) < 50:
             print(f"Warning: Extracted text is too short or empty. It might be a dynamic JS site.", file=sys.stderr)
        
        # Manually chunk the text (simple word-based chunking similar to ingest.py)
        # Using langchain's RecursiveCharacterTextSplitter if available, or fallback
        try:
             from langchain.text_splitter import RecursiveCharacterTextSplitter
             text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
             chunks = text_splitter.split_text(text)
        except ImportError:
             # Basic fallback chunking (paragraph-aware)
             paragraphs = text.split('\n\n')
             chunks = []
             current_chunk = ""
             for p in paragraphs:
                 if len(current_chunk) + len(p) < 1000:
                     current_chunk += p + "\n\n"
                 else:
                     if current_chunk: chunks.append(current_chunk.strip())
                     current_chunk = p + "\n\n"
             if current_chunk: chunks.append(current_chunk.strip())
             
        if not chunks:
             print("No chunks generated from extracted text.", file=sys.stderr)
             sys.exit(1)
             
        print(f"Generated {len(chunks)} chunks. Creating embeddings...", file=sys.stderr)
        
        # Vectorize
        embeddings = get_embeddings(chunks)
        
        documents = []
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            documents.append({
                "text": chunk,
                "embedding": emb,
                "source": source_name,
                "chunk_index": i,
                "type": "web"
            })
            
        print("Connecting to MongoDB Atlas...", file=sys.stderr)
        client = MongoClient(MONGODB_URI)
        db = client['rag_chatbot']
        collection = db['vectorStore']
        
        if documents:
            collection.insert_many(documents)
            print(f"Successfully stored {len(documents)} chunks from {url}", file=sys.stderr)
        else:
             print("No documents generated to store.", file=sys.stderr)
             
        client.close()
        
        # Return success exactly in the format Node.js expects
        pages_scraped = len(scraped_urls)
        print(json.dumps({
            "success": True, 
            "message": f"Successfully ingested {pages_scraped} pages from {main_title}", 
            "chunks": len(documents),
            "source": source_name,
            "pages": pages_scraped
        }))

    except Exception as e:
        print(f"Error ingesting URL: {e}", file=sys.stderr)
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scrape.py <url> [--deep]", file=sys.stderr)
        print(json.dumps({"success": False, "error": "No URL provided"}))
        sys.exit(1)
        
    target_url = sys.argv[1]
    is_deep = len(sys.argv) > 2 and sys.argv[2] == '--deep'
    
    ingest_url(target_url, is_deep)
