from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import openai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    prompt: str
    files: List[str]
    system_prompt: Optional[str] = None

@app.post("/api/chat")
async def chat_with_llm(request: PromptRequest):
    try:
        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        messages = []
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        
        messages.append({"role": "user", "content": request.prompt})
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0.7,
        )
        
        return {
            "response": response.choices[0].message.content,
            "references": [] # TODO: Implement reference extraction
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    # TODO: Implement file upload logic (local or GCS)
    pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 