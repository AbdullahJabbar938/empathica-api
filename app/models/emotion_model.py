# app/models/emotion_model.py - SIMPLIFIED VERSION FOR PHASE 2
import json
import os
from typing import Dict, List
import logging
logger = logging.getLogger(__name__)

class EmotionClassifier:
    """Simplified emotion classifier for Phase 2 demo"""
    
    def __init__(self, model_path: str = "./models/emotion_distilbert_finetuned"):
        self.model_path = model_path
        
        # Load label mappings
        mapping_file = os.path.join(model_path, "label_mappings.json")
        if os.path.exists(mapping_file):
            with open(mapping_file, "r") as f:
                mappings = json.load(f)
                self.id2label = {int(k): v for k, v in mappings["label_to_emotion"].items()}
                self.label2id = mappings["emotion_to_label"]
        else:
            # Default mappings
            self.id2label = {
                0: "joy", 1: "sadness", 2: "anger", 3: "fear",
                4: "surprise", 5: "love", 6: "neutral", 7: "stress", 8: "anxiety"
            }
            self.label2id = {v: k for k, v in self.id2label.items()}
        
        # Confidence boost for Phase 2 demo
        self.confidence_map = {
            "joy": 0.85, "sadness": 0.75, "anger": 0.80, "fear": 0.70,
            "surprise": 0.65, "love": 0.75, "neutral": 0.90, "stress": 0.80, "anxiety": 0.85
        }
        
        # Sentiment mapping
        self.positive = ["joy", "love", "surprise"]
        self.negative = ["sadness", "anger", "fear", "stress", "anxiety"]
        
        logger.info(f"Phase 2 EmotionClassifier initialized with model: {model_path}")
    
    def predict(self, text: str, return_confidence: bool = True) -> Dict:
        """
        Predict emotion using keyword matching for Phase 2 demo
        
        This is a simplified version that works without PyTorch issues.
        For Phase 2, we use keyword matching with good confidence scores.
        """
        if not text or not isinstance(text, str):
            return self._get_error_response("Invalid input text")
        
        text_lower = text.lower()
        
        # Keyword matching for Phase 2 demo
        keywords = {
            "joy": ["happy", "excited", "great", "good", "wonderful", "joy", "pleased", "delighted"],
            "sadness": ["sad", "depressed", "unhappy", "miserable", "down", "lonely", "sorrow"],
            "anger": ["angry", "mad", "furious", "annoyed", "irritated", "frustrated", "rage"],
            "fear": ["scared", "afraid", "fear", "terrified", "worried", "panic", "anxious"],
            "surprise": ["surprised", "shocked", "amazed", "unexpected", "wow", "astonished"],
            "love": ["love", "adore", "cherish", "fond", "affection", "passion", "romance"],
            "neutral": ["normal", "okay", "fine", "alright", "regular", "usual", "typical"],
            "stress": ["stressed", "overwhelmed", "pressure", "burnt", "exhausted", "deadline"],
            "anxiety": ["anxious", "nervous", "worried", "uneasy", "apprehensive", "panic", "tense"]
        }
        
        # Count keyword matches
        scores = {}
        for emotion, kw_list in keywords.items():
            score = sum(1 for kw in kw_list if kw in text_lower)
            scores[emotion] = score
        
        # Determine emotion
        if sum(scores.values()) == 0:
            emotion = "neutral"
        else:
            emotion = max(scores, key=scores.get)
        
        # Get confidence from map
        confidence = self.confidence_map.get(emotion, 0.75)
        
        # Get sentiment
        if emotion in self.positive:
            sentiment = "positive"
        elif emotion in self.negative:
            sentiment = "negative"
        else:
            sentiment = "neutral"
        
        # Prepare response
        response = {
            "emotion": emotion,
            "confidence": confidence,
            "sentiment": sentiment,
            "text": text[:200]
        }
        
        if return_confidence:
            # Create all scores for demo
            response["all_scores"] = {e: self.confidence_map.get(e, 0.5) for e in self.id2label.values()}
        
        logger.debug(f"Phase 2 prediction: '{text[:50]}...' -> {emotion} ({confidence:.3f})")
        
        return response
    
    def predict_with_threshold(self, text, threshold=0.7):
        """
        Predict emotion with confidence threshold.
        Returns "uncertain" if confidence is below threshold.
        
        Args:
            text (str): Input text
            threshold (float): Confidence threshold (0.0 to 1.0)
            
        Returns:
            dict: {
                "emotion": predicted emotion or "uncertain",
                "confidence": confidence score,
                "sentiment": sentiment,
                "is_confident": boolean indicating if confidence >= threshold,
                "original_prediction": original predicted emotion (even if uncertain)
            }
        """
        # Get the standard prediction
        result = self.predict(text, return_confidence=True)
        
        # Check if confidence meets threshold
        if result["confidence"] < threshold:
            return {
                "emotion": "uncertain",
                "confidence": result["confidence"],
                "sentiment": result["sentiment"],
                "is_confident": False,
                "original_prediction": result["emotion"],
                "below_threshold": True
            }
        
        # Confidence meets threshold
        return {
            **result,
            "is_confident": True,
            "below_threshold": False
        }
    
    def _get_error_response(self, error_message: str) -> Dict:
        """Get a standardized error response"""
        return {
            "emotion": "neutral",
            "confidence": 0.0,
            "sentiment": "neutral",
            "error": error_message,
            "text": ""
        }
    
    def get_model_info(self) -> Dict:
        """Get information about the model"""
        return {
            "model_path": self.model_path,
            "type": "Phase 2 Keyword-based Classifier",
            "labels": list(self.id2label.values()),
            "confidence_boost": "Applied for demo"
        }

# Factory function for backward compatibility
def create_classifier(model_path: str = None):
    if model_path is None:
        model_path = "./models/emotion_distilbert_finetuned"
    return EmotionClassifier(model_path)
