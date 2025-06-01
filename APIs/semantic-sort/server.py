from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
from dotenv import load_dotenv
import os
from supabase import create_client, Client
import traceback

load_dotenv()

class SupabaseClient:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.client: Client = create_client(self.url, self.key)

    def fetch_document_descriptions(self):
        print("Attempting Supabase fetch...")
        response = self.client.table("documents").select("*").limit(5).execute()

        return response.data


app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

model = SentenceTransformer("all-MiniLM-L6-v2")
db = SupabaseClient()


class QueryInput(BaseModel):
    query: str


@app.post("/sort-db")
def sort_documents_from_db(data: QueryInput):
    try:
        docs = db.fetch_document_descriptions()

        descriptions = [d["ai_suggested_title"] for d in docs]

        if not descriptions:
            return {"error": "No valid descriptions found in database."}

        ids = [d["id"] for d in docs]

        query_embedding = model.encode(data.query)
        doc_embeddings = model.encode(descriptions)

        similarities = np.dot(doc_embeddings, query_embedding) / (
                np.linalg.norm(doc_embeddings, axis=1) * np.linalg.norm(query_embedding)
        )

        sorted_docs = sorted(
            zip(ids, descriptions, similarities),
            key=lambda x: x[2],
            reverse=True
        )

        return {
            "results": [
                {"id": id_, "description": desc, "score": float(score)}
                for id_, desc, score in sorted_docs
            ]
        }

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}
