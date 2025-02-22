from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from model import generate_response

app = FastAPI()

# Enable CORS so Next.js can communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow frontend to access backend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request structure
class QueryRequest(BaseModel):
    prompt: str

@app.post("/generate")
async def generate_text(request: QueryRequest):
    response = generate_response(request.prompt)
    return {"response": response}

