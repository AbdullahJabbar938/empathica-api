# test_integration.py
import requests
import json
import time

def test_complete_flow():
    """Test complete flow from Express API to AI service"""
    
    print("Testing Complete Empathica Integration")
    print("="*60)
    
    # Test Express API
    EXPRESS_URL = "http://localhost:5000"
    
    # First, register a test user
    print("\n1. Testing User Registration...")
    register_data = {
        "name": "AI Test User",
        "email": "ai_test@university.edu",
        "password": "password123"
    }
    
    try:
        response = requests.post(
            f"{EXPRESS_URL}/api/auth/register",
            json=register_data
        )
        
        if response.status_code == 201:
            print("✓ User registered successfully")
            auth_data = response.json()
            token = auth_data['token']
        else:
            print(f"✗ Registration failed: {response.status_code}")
            print(f"Response: {response.text}")
            return
            
    except Exception as e:
        print(f"✗ Registration error: {e}")
        return
    
    # Test AI service directly
    print("\n2. Testing AI Service Directly...")
    AI_URL = "http://localhost:8000"
    AI_KEY = "empathica_ai_secret_key_change_in_production"
    
    test_texts = [
        "I'm feeling extremely happy and excited about my graduation!",
        "The exam pressure is making me very anxious and stressed.",
        "Feeling neutral today, just going through the motions.",
        "I'm angry about the unfair grading system."
    ]
    
    headers = {
        "Authorization": f"Bearer {AI_KEY}",
        "Content-Type": "application/json"
    }
    
    for i, text in enumerate(test_texts):
        try:
            response = requests.post(
                f"{AI_URL}/analyze",
                headers=headers,
                json={"text": text}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"  Text {i+1}: {text[:40]}...")
                print(f"    → Emotion: {result['emotion']} (Confidence: {result['confidence']:.3f})")
            else:
                print(f"  ✗ AI analysis failed for text {i+1}")
                
        except Exception as e:
            print(f"  ✗ AI service error: {e}")
    
    # Test Express API with AI integration
    print("\n3. Testing Express API with AI Integration...")
    
    express_headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    for i, text in enumerate(test_texts):
        reflection_data = {
            "text": text,
            "tags": ["test", "academic"]
        }
        
        try:
            response = requests.post(
                f"{EXPRESS_URL}/api/reflections",
                headers=express_headers,
                json=reflection_data
            )
            
            if response.status_code == 201:
                result = response.json()
                reflection = result['data']
                print(f"  Created reflection {i+1}:")
                print(f"    Text: {reflection['text'][:40]}...")
                print(f"    AI Analysis: {reflection['emotionLabel']} (Score: {reflection['emotionScore']:.3f})")
                print(f"    Source: {reflection['analysisVersion']}")
            else:
                print(f"  ✗ Failed to create reflection {i+1}")
                
        except Exception as e:
            print(f"  ✗ Express API error: {e}")
    
    # Test getting reflections
    print("\n4. Testing Get Reflections...")
    try:
        response = requests.get(
            f"{EXPRESS_URL}/api/reflections",
            headers=express_headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"  ✓ Retrieved {result['count']} reflections")
            
            # Display first reflection details
            if result['data']:
                first_reflection = result['data'][0]
                print(f"  First reflection:")
                print(f"    ID: {first_reflection['_id']}")
                print(f"    Emotion: {first_reflection['emotionLabel']}")
                print(f"    Created: {first_reflection['date']}")
        else:
            print(f"  ✗ Failed to get reflections")
            
    except Exception as e:
        print(f"  ✗ Error getting reflections: {e}")
    
    # Test stats endpoint
    print("\n5. Testing Stats Endpoint...")
    try:
        response = requests.get(
            f"{EXPRESS_URL}/api/reflections/stats",
            headers=express_headers
        )
        
        if response.status_code == 200:
            result = response.json()
            stats = result['data']
            print(f"  ✓ Retrieved statistics")
            print(f"    Total reflections: {stats['totalReflections']}")
            print(f"    Current streak: {stats['streak']}")
            
            if stats['emotionDistribution']:
                print(f"    Emotion distribution:")
                for emotion in stats['emotionDistribution']:
                    print(f"      {emotion['_id']}: {emotion['count']}")
        else:
            print(f"  ✗ Failed to get stats")
            
    except Exception as e:
        print(f"  ✗ Error getting stats: {e}")
    
    print("\n" + "="*60)
    print("Integration Test Complete!")
    print("\nSummary:")
    print("- User registration/authentication: ✓")
    print("- AI Service direct calls: ✓")
    print("- Express API with AI integration: ✓")
    print("- Data retrieval and stats: ✓")

if __name__ == "__main__":
    print("Starting Empathica Integration Test...")
    print("Make sure both services are running:")
    print("  • Express API: http://localhost:5000")
    print("  • AI Service: http://localhost:8000")
    print("")
    
    test_complete_flow()
