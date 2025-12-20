"""
Flask API Server for ASL Sign Language Recognition
Uses ASL-style preprocessing to match the training pipeline
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import base64
from tensorflow import keras
import json
import os

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Global variables for model
model = None
metadata = None

# Preprocessing constants (matching your trained model)
IMG_SIZE = 64  # Changed from 128 to 64
MIN_THRESHOLD_VALUE = 70

# Class names mapping (A-Z only, no '0')
CLASS_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
               'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

def load_model():
    """Load the trained model and metadata"""
    global model, metadata
    
    try:
        print("Loading ASL sign language model...")
        
        # Use your trained best_model.h5 (100% accuracy)
        # Check multiple possible locations for the model
        possible_paths = [
            'best_model.h5',  # Same directory (for Render deployment)
            '../frontend/public/models/best_model.h5',  # Local development
            '/opt/render/project/src/model-training/best_model.h5'  # Render absolute path
        ]
        
        model_path = None
        for path in possible_paths:
            if os.path.exists(path):
                model_path = path
                break
        
        if model_path is None:
            raise FileNotFoundError("Model file not found in any expected location")
        
        # Load model
        model = keras.models.load_model(model_path)
        print(f"✓ Model loaded from {model_path}")
        
        # Set metadata manually since we switched models
        metadata = {
            'class_names': CLASS_NAMES,
            'img_size': IMG_SIZE,
            'preprocessing': 'Grayscale -> Crop -> Blur -> Adaptive Threshold -> Otsu -> Resize 128x128'
        }
        
        print(f"✓ Metadata initialized: {len(metadata['class_names'])} classes")
        print(f"✓ Image size: {metadata['img_size']}x{metadata['img_size']}")
        
        return True
    except Exception as e:
        print(f"✗ Error loading model: {e}")
        import traceback
        traceback.print_exc()
        return False

def preprocess_image_notebook_style(img, img_size=IMG_SIZE, min_value=MIN_THRESHOLD_VALUE):
    """
    Preprocessing pipeline matching ASL_Real-Time.ipynb:
    1. Grayscale
    2. Crop (simulated center crop if not already cropped)
    3. Gaussian Blur
    4. Adaptive Threshold
    5. Otsu Threshold
    6. Resize
    7. Normalize
    """
    try:
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # The notebook uses a fixed crop: crop_img = gray[24:250, 24:250]
        # This assumes a specific input resolution (likely 640x480 or similar where the hand is in that box).
        # To be more robust for the web app, we'll take a center crop that is square.
        h, w = gray.shape
        min_dim = min(h, w)
        start_x = (w - min_dim) // 2
        start_y = (h - min_dim) // 2
        crop_img = gray[start_y:start_y+min_dim, start_x:start_x+min_dim]
        
        # Apply Gaussian blur
        blur = cv2.GaussianBlur(crop_img, (5, 5), 2)
        
        # Apply adaptive thresholding
        th3 = cv2.adaptiveThreshold(
            blur, 255, 
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 11, 2
        )
        
        # Apply Otsu's thresholding
        ret, res = cv2.threshold(
            th3, min_value, 255, 
            cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )
        
        # Resize to target size (128x128)
        resized = cv2.resize(res, (img_size, img_size))
        
        return resized
    except Exception as e:
        print(f'Exception in preprocessing: {e}')
        return None

def preprocess_image(image_data):
    """Preprocess image using the notebook's pipeline"""
    try:
        # Decode base64 image
        img_bytes = base64.b64decode(image_data.split(',')[1])
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            print("Failed to decode image")
            return None
        
        # Apply notebook-style preprocessing
        processed = preprocess_image_notebook_style(img)
        
        if processed is None:
            return None
        
        # Normalize to [0, 1]
        normalized = processed.astype('float32') / 255.0
        
        # Reshape for model (1, 128, 128, 1)
        # Notebook: reshaped=np.reshape(normalized,(1,img_size,img_size,1))
        final = np.reshape(normalized, (1, IMG_SIZE, IMG_SIZE, 1))
        
        return final
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        import traceback
        traceback.print_exc()
        return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'classes': len(metadata['class_names']) if metadata else 0,
        'preprocessing': metadata.get('preprocessing', 'Unknown') if metadata else 'Unknown'
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Prediction endpoint"""
    try:
        # Get image data from request
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Preprocess image
        processed_image = preprocess_image(data['image'])
        if processed_image is None:
            return jsonify({'error': 'Failed to process image'}), 400
        
        # Make prediction
        predictions = model.predict(processed_image, verbose=0)
        predicted_class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_idx])
        
        # Get class name
        predicted_sign = metadata['class_names'][predicted_class_idx]
        
        # Get top 5 predictions for debugging
        top_5_indices = np.argsort(predictions[0])[-5:][::-1]
        top_5_predictions = [
            {
                'sign': metadata['class_names'][idx],
                'confidence': float(predictions[0][idx])
            }
            for idx in top_5_indices
        ]
        
        # Debug logging
        print(f"Prediction: {predicted_sign} ({confidence:.2%})")
        
        # Return prediction
        confidence_threshold = data.get('threshold', 0.5)
        debug_mode = data.get('debug', False)
        
        response_data = {
            'success': True,
            'sign': predicted_sign if confidence >= confidence_threshold else None,
            'confidence': confidence,
            'top_predictions': top_5_predictions
        }
        
        if confidence < confidence_threshold:
            response_data['message'] = f'Confidence ({confidence:.2f}) below threshold ({confidence_threshold})'

        # If debug mode is on, return the preprocessed image as base64
        if debug_mode:
            # processed_image is (1, 128, 128, 1) float32 [0,1]
            # Convert back to uint8 [0,255] for display
            debug_img = (processed_image[0, :, :, 0] * 255).astype(np.uint8)
            
            # Encode to jpg base64
            _, buffer = cv2.imencode('.jpg', debug_img)
            debug_base64 = base64.b64encode(buffer).decode('utf-8')
            response_data['debug_image'] = f"data:image/jpeg;base64,{debug_base64}"
            
        return jsonify(response_data)
            
    except Exception as e:
        print(f"Prediction error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/classes', methods=['GET'])
def get_classes():
    """Get list of all classes"""
    if metadata:
        return jsonify({
            'classes': metadata['class_names'],
            'num_classes': len(metadata['class_names']),
            'img_size': metadata['img_size']
        })
    return jsonify({'error': 'Model not loaded'}), 500

if __name__ == '__main__':
    print("="*60)
    print("ASL Sign Language Recognition API Server")
    print("="*60)
    
    # Load model
    if load_model():
        print("\n✓ Server ready!")
        print(f"✓ Serving {len(metadata['class_names'])} sign language classes")
        print(f"✓ Preprocessing: {metadata['preprocessing']}")
        print("\nStarting Flask server on http://localhost:5001")
        print("API Endpoints:")
        print("  - GET  /health  - Health check")
        print("  - POST /predict - Make prediction")
        print("  - GET  /classes - Get list of classes")
        print("\n" + "="*60)
        
        # Start server on port 5001
        app.run(host='0.0.0.0', port=5001, debug=False)
    else:
        print("\n✗ Failed to load model. Server not started.")
