# ai-service/tests/test_emotion_detection.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.emotion_detector import EmotionDetector

client = TestClient(app)

class TestEmotionDetection:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.detector = EmotionDetector()
        yield
        # Cleanup after each test
    
    def test_emotion_detection_endpoint(self):
        """Test the emotion detection API endpoint."""
        test_text = "I'm feeling really happy and excited about today!"
        
        response = client.post(
            "/analyze",
            json={"text": test_text}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "emotion" in data
        assert "confidence" in data
        assert "sentiment" in data
        
        # Should detect positive emotion
        assert data["emotion"] in ["joy", "love", "surprise"]
        assert data["sentiment"] == "positive"
        assert data["confidence"] > 0.7
    
    def test_empty_text(self):
        """Test emotion detection with empty text."""
        response = client.post(
            "/analyze",
            json={"text": ""}
        )
        
        assert response.status_code == 400
    
    def test_very_long_text(self):
        """Test emotion detection with very long text."""
        long_text = "text " * 1000
        
        response = client.post(
            "/analyze",
            json={"text": long_text}
        )
        
        assert response.status_code == 200
        # Should handle long texts efficiently
    
    def test_multilingual_support(self):
        """Test emotion detection in different languages."""
        test_cases = [
            ("Estoy muy feliz hoy", "joy"),  # Spanish
            ("Je suis très triste", "sadness"),  # French
            ("Ich bin wütend", "anger"),  # German
            ("我有點緊張", "anxiety"),  # Chinese
        ]
        
        for text, expected_emotion in test_cases:
            response = client.post(
                "/analyze",
                json={"text": text}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Model should detect appropriate emotion
            assert data["emotion"] == expected_emotion
    
    def test_model_confidence_threshold(self):
        """Test that low confidence predictions are handled."""
        ambiguous_text = "It was okay."
        
        response = client.post(
            "/analyze",
            json={"text": ambiguous_text}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return neutral for ambiguous text
        assert data["emotion"] == "neutral"
        assert data["confidence"] < 0.6
    
    def test_batch_processing(self):
        """Test batch emotion detection."""
        texts = [
            "I'm so happy!",
            "This makes me sad.",
            "I'm angry about this.",
            "I'm scared of what might happen."
        ]
        
        response = client.post(
            "/analyze/batch",
            json={"texts": texts}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["results"]) == len(texts)
        for result in data["results"]:
            assert "emotion" in result
            assert "confidence" in result
    
    def test_model_performance(self):
        """Test model inference performance."""
        import time
        
        test_text = "This is a test for performance measurement."
        
        # Warm up
        for _ in range(10):
            client.post("/analyze", json={"text": test_text})
        
        # Performance test
        start_time = time.time()
        iterations = 100
        
        for _ in range(iterations):
            response = client.post(
                "/analyze",
                json={"text": test_text}
            )
            assert response.status_code == 200
        
        end_time = time.time()
        average_time = (end_time - start_time) / iterations
        
        # Should process within 100ms on average
        assert average_time < 0.1
        print(f"Average inference time: {average_time*1000:.2f}ms")
    
    def test_error_handling(self):
        """Test error handling in emotion detection."""
        # Test with invalid input
        response = client.post(
            "/analyze",
            json={"invalid": "data"}
        )
        
        assert response.status_code == 422
        
        # Test with malformed text
        response = client.post(
            "/analyze",
            json={"text": None}
        )
        
        assert response.status_code == 422
    
    def test_model_fallback(self):
        """Test fallback mechanism when primary model fails."""
        # Mock primary model failure
        original_predict = self.detector.predict
        self.detector.predict = lambda x: {"emotion": "error", "confidence": 0}
        
        response = client.post(
            "/analyze",
            json={"text": "Test text"}
        )
        
        # Should use fallback model
        assert response.status_code == 200
        data = response.json()
        
        assert data["emotion"] != "error"
        assert data["confidence"] > 0
        
        # Restore original method
        self.detector.predict = original_predict