from fastapi import FastAPI, HTTPException # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware # pyright: ignore[reportMissingImports]
from pydantic import BaseModel # pyright: ignore[reportMissingImports]
import uvicorn # pyright: ignore[reportMissingImports]
import time
import os

from app.models.emotion_model import EmotionClassifier # pyright: ignore[reportMissingImports]

# Initialize FastAPI app
app = FastAPI(
    title="Empathica AI Service",
    description="Emotion Analysis API for Mental Wellness Platform",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None
)

# Configure CORS for production
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize classifier with error handling
try:
    print("Loading emotion classifier...")
    classifier = EmotionClassifier()
    print(f"✅ Classifier loaded successfully. Available emotions: {classifier.emotion_labels}")
except Exception as e:
    print(f"❌ Failed to load classifier: {e}")
    classifier = None

# Request/Response Models
class TextRequest(BaseModel):
    text: str

class EmotionResponse(BaseModel):
    emotion: str
    confidence: float
    sentiment: str
    processing_time: float

# Routes
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Empathica AI Emotion Analysis Service",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "analyze": "POST /analyze - Analyze emotion from text",
            "health": "GET /health - Health check",
            "emotions": "GET /emotions - List available emotions",
            "docs": "/docs - API documentation (development only)"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "emotion-analysis",
        "classifier_loaded": classifier is not None,
        "available_emotions": len(classifier.emotion_labels) if classifier else 0,
        "timestamp": time.time(),
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.post("/analyze", response_model=EmotionResponse)
async def analyze_emotion(request: TextRequest):
    """Analyze emotion from text"""
    # Validate input
    if not request.text or len(request.text.strip()) < 3:
        raise HTTPException(status_code=400, detail="Text must be at least 3 characters long")
    
    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long (max 5000 characters)")
    
    # Check if classifier is loaded
    if classifier is None:
        raise HTTPException(status_code=503, detail="Emotion classifier not available")
    
    try:
        start_time = time.time()
        
        # Analyze emotion
        result = classifier.predict(request.text)
        
        processing_time = time.time() - start_time
        
        return EmotionResponse(
            emotion=result["emotion"],
            confidence=float(result["confidence"]),
            sentiment=result["sentiment"],
            processing_time=round(processing_time, 4)
        )
        
    except Exception as e:
        print(f"Error analyzing text: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@app.get("/emotions")
async def get_available_emotions():
    """Get list of available emotion labels"""
    if classifier is None:
        raise HTTPException(status_code=503, detail="Emotion classifier not available")
    
    return {
        "emotions": classifier.emotion_labels,
        "count": len(classifier.emotion_labels),
        "sentiment_mapping": {
            "positive": ["joy", "love", "surprise"],
            "negative": ["sadness", "anger", "fear", "stress", "anxiety"],
            "neutral": ["neutral"]
        }
    }

# New endpoint for batch analysis (optional)
class BatchRequest(BaseModel):
    texts: list[str]

@app.post("/analyze/batch")
async def analyze_batch(request: BatchRequest):
    """Analyze multiple texts in batch"""
    if classifier is None:
        raise HTTPException(status_code=503, detail="Emotion classifier not available")
    
    if len(request.texts) > 100:
        raise HTTPException(status_code=400, detail="Too many texts (max 100)")
    
    results = []
    total_start = time.time()
    
    for text in request.texts:
        try:
            result = classifier.predict(text)
            results.append({
                "text": text[:50] + "...",  # Truncate for response
                "emotion": result["emotion"],
                "confidence": float(result["confidence"]),
                "sentiment": result["sentiment"]
            })
        except Exception as e:
            results.append({
                "text": text[:50] + "...",
                "error": str(e)
            })
    
    return {
        "results": results,
        "total_processing_time": round(time.time() - total_start, 4),
        "count": len(results)
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("ENVIRONMENT") != "production"
    )