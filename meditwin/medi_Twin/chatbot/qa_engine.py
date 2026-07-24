"""
Medical QA generative engine using Ollama.

Uses a local Ollama server running `medllama2` or any compatible model
to generate conversational medical responses.
"""
import requests
import json
from medi_Twin.mongo import get_collection

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "medllama2"

def find_best_answer(user_question, context=None):
    """
    Generate an answer using local Ollama model.
    """
    # Intercept simple greetings to speed up response and save compute
    greetings = ['hi', 'hello', 'hey', 'how are you', 'good morning', 'good afternoon', 'good evening', 'hi there', 'hello there']
    cleaned_query = user_question.strip().lower().rstrip('!?.,')
    if cleaned_query in greetings:
        return {
            'answer': "Hello! I am MediBot, your AI health assistant. I'm here to help answer questions about symptoms, medications, or general medical conditions. How can I assist you today?",
            'confidence': 1.0,
            'matched_question': 'Greeting'
        }

    system_prompt = (
        "You are MediBot, a highly capable AI medical assistant for the MediTwin platform. "
        "Provide clear, concise, and helpful medical information based on the user's input. "
        "Always be empathetic and remind the user to consult a doctor for serious conditions."
    )
    
    prompt = f"{system_prompt}\n\nUser: {user_question}\nMediBot:"

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2
        }
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        bot_reply = data.get("response", "").strip()
        
        return {
            'answer': bot_reply,
            'confidence': 0.9, # Fake high confidence since it's generative
            'matched_question': 'Generative LLM'
        }
    except requests.exceptions.RequestException as e:
        return {
            'answer': "My local AI engine (Ollama) is currently offline or the medllama2 model is not installed. Please make sure Ollama is running.",
            'confidence': 0.0,
            'error': str(e)
        }

def get_dataset_stats():
    """Return stats about the generative model."""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=2)
        models = response.json().get('models', [])
        installed = any(m['name'].startswith(MODEL_NAME) for m in models)
        return {
            'ollama_running': True,
            'model_installed': installed,
            'model_name': MODEL_NAME
        }
    except:
        return {
            'ollama_running': False,
            'model_installed': False,
            'model_name': MODEL_NAME
        }
