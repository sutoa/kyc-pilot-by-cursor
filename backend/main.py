from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import openai
import fitz  # PyMuPDF
import os
from dotenv import load_dotenv
import time
from tempfile import NamedTemporaryFile

# Load environment variables
load_dotenv()

# Configure OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4")

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    prompt: str

async def extract_text_from_pdf(file: UploadFile) -> str:
    try:
        # Create a temporary file to store the uploaded content
        content = await file.read()
        with NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        # Process the PDF
        doc = fitz.open(tmp_path)
        text = ''
        for page in doc:
            text += page.get_text()
        doc.close()

        # Clean up
        os.unlink(tmp_path)
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return f"Error processing PDF: {str(e)}"

@app.post("/api/extract-text")
async def extract_text(file: UploadFile = File(...)):
    try:
        print(f"\nReceived file: {file.filename}, size: {file.size}, content_type: {file.content_type}")
        content = await file.read()
        print(f"Successfully read file content, size: {len(content)} bytes")
        
        if file.filename.lower().endswith('.pdf'):
            print("Processing as PDF file...")
            with NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
                tmp.write(content)
                tmp_path = tmp.name
                print(f"Wrote content to temporary file: {tmp_path}")

            try:
                print("Attempting to open PDF with PyMuPDF...")
                doc = fitz.open(tmp_path)
                print(f"Successfully opened PDF. Number of pages: {doc.page_count}")
                
                text = ''
                for i, page in enumerate(doc):
                    print(f"Processing page {i+1}/{doc.page_count}")
                    text += page.get_text()
                doc.close()
                print("Successfully extracted text from all pages")

                # Clean up
                os.unlink(tmp_path)
                print("Cleaned up temporary file")
                
                print(f"Total extracted text length: {len(text)} characters")
                return {"text": text}
            except Exception as e:
                print(f"Error processing PDF: {str(e)}")
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
                    print("Cleaned up temporary file after error")
                return {"error": f"Error processing PDF: {str(e)}"}
        else:
            print("Processing as text file...")
            try:
                text = content.decode('utf-8')
                print(f"Successfully decoded text file, length: {len(text)} characters")
                return {"text": text}
            except UnicodeDecodeError as e:
                print(f"Error decoding text file: {str(e)}")
                return {"error": "File appears to be binary or not valid UTF-8 text"}
    except Exception as e:
        print(f"Unexpected error in extract_text endpoint: {str(e)}")
        return {"error": str(e)}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        print("\n=== Prompt being sent to LLM ===")
        print(request.prompt)
        print("================================\n")
        
        print("Submitting to LLM next1 ...")
        start = time.perf_counter()

        os.environ["OPENAI_API_KEY"] = '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'
        
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant analyzing documents. When asked to provide information in JSON format, ensure the response is valid JSON. When asked for a table, format the response using markdown table syntax."},
                {"role": "user", "content": request.prompt}
            ],
            temperature=0.1,
            max_tokens=2000
        )
        
        end = time.perf_counter()
        print(f"LLM completed in {end - start:.6f} seconds")
        print("\n=== LLM Response ===")
        print(response.choices[0].message.content)
        print("===================\n")

        return {
            "response": response.choices[0].message.content
        }

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return {"error": str(e)} 