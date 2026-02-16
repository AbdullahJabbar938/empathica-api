# app/services/emotion_service.py

import asyncio
import time
from typing import Dict, List, AsyncGenerator
from loguru import logger

from app.models.emotion_model import EmotionClassifier
from app.core.config import settings


class EmotionService:
    def __init__(self):
        self.model: EmotionClassifier | None = None
        self.model_loaded: bool = False
        self.start_time = time.time()
        self._init_model()

    def _init_model(self):
        """Initialize the fine-tuned emotion model"""
        try:
            logger.info(f"Loading fine-tuned emotion model from {settings.MODEL_PATH}...")

            # Initialize classifier with fine-tuned model path
            self.model = EmotionClassifier(model_path=settings.MODEL_PATH)

            # Run a small test inference to verify loading
            test_result = self.model.predict("Test initialization", return_confidence=True)

            if "error" not in test_result:
                self.model_loaded = True
                logger.info("✓ Fine-tuned emotion model loaded successfully")

                # Log model metadata if available
                if hasattr(self.model, "get_model_info"):
                    logger.info(f"Model info: {self.model.get_model_info()}")
            else:
                logger.error(f"Model test failed: {test_result.get('error')}")
                self.model_loaded = False

        except Exception as e:
            logger.exception("Failed to load emotion model")
            self.model_loaded = False

    # -------------------------
    # Utility methods
    # -------------------------

    def is_model_loaded(self) -> bool:
        return self.model_loaded

    def get_uptime(self) -> float:
        return time.time() - self.start_time

    def get_available_emotions(self) -> List[str]:
        """Return emotion labels from model if available"""
        if self.model and hasattr(self.model, "id2label"):
            return list(self.model.id2label.values())

        return [
            "joy",
            "sadness",
            "anger",
            "fear",
            "surprise",
            "love",
            "neutral",
            "stress",
            "anxiety",
        ]

    # -------------------------
    # Core analysis methods
    # -------------------------

    async def analyze_text(self, text: str, return_all_scores: bool = False) -> Dict:
        """
        Analyze emotion from text using fine-tuned model
        """
        if not self.model_loaded:
            raise RuntimeError("Emotion model not loaded")

        start_time = time.time()

        try:
            result = self.model.predict(text, return_confidence=True)

            # Handle model-level errors
            if "error" in result:
                raise RuntimeError(result["error"])

            processing_time = time.time() - start_time
            confidence = float(result.get("confidence", 0.0))

            # Warn on very low confidence
            if confidence < 0.3:
                logger.warning(
                    f"Low confidence ({confidence:.3f}) for text: '{text[:50]}...'"
                )

            response = {
                "emotion": result["emotion"],
                "confidence": confidence,
                "sentiment": result.get("sentiment", "neutral"),
                "processing_time": round(processing_time, 4),
            }

            if return_all_scores and "all_scores" in result:
                response["all_scores"] = result["all_scores"]

            if "top_predictions" in result:
                response["top_predictions"] = result["top_predictions"][:3]

            logger.info(
                f"Analyzed: '{text[:50]}...' → {result['emotion']} "
                f"({confidence:.3f}) in {processing_time:.3f}s"
            )

            return response

        except Exception as e:
            logger.error(f"Emotion analysis failed: {str(e)}")
            return {
                "emotion": "neutral",
                "confidence": 0.0,
                "sentiment": "neutral",
                "processing_time": round(time.time() - start_time, 4),
                "error": str(e),
            }

    async def analyze_batch(self, texts: List[str]) -> List[Dict]:
        """
        Analyze emotions for multiple texts (batched)
        """
        if not self.model_loaded:
            raise RuntimeError("Emotion model not loaded")

        results: List[Dict] = []
        batch_size = settings.BATCH_SIZE

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]

            for text in batch:
                result = await self.analyze_text(text)
                results.append(result)

            # Small async pause between batches
            if i + batch_size < len(texts):
                await asyncio.sleep(0.1)

        return results

    async def analyze_stream(self, text: str) -> AsyncGenerator[Dict, None]:
        """
        Stream emotion analysis results chunk-by-chunk
        """
        if not self.model_loaded:
            raise RuntimeError("Emotion model not loaded")

        words = text.split()
        chunk_size = max(1, len(words) // 10)

        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i : i + chunk_size])

            if chunk.strip():
                result = await self.analyze_text(chunk)
                yield result

            await asyncio.sleep(0.1)

    # -------------------------
    # Stats (placeholder)
    # -------------------------

    def get_emotion_statistics(self) -> Dict:
        """
        Placeholder for tracking emotion usage statistics
        """
        return {
            "total_predictions": 0,
            "most_common_emotion": "neutral",
            "average_confidence": 0.0,
            "average_processing_time": 0.0,
        }


# Singleton instance
emotion_service = EmotionService()
