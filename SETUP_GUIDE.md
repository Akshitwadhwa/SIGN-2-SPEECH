# 🚀 SIGN-2-SPEECH Setup Guide for New PC

Complete step-by-step instructions to run this project on any computer.

---

## 📋 Prerequisites

Before starting, ensure you have:

### Required Software:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 - 3.11) - [Download here](https://www.python.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Webcam** (for sign language detection)

### Check Installations:
```bash
# Verify Node.js
node --version

# Verify npm
npm --version

# Verify Python
python --version
# or
python3 --version

# Verify Git
git --version
```

---

## 🔽 Step 1: Clone the Repository

```bash
# Clone the project
git clone https://github.com/Akshitwadhwa/SIGN-2-SPEECH.git

# Navigate into the project
cd SIGN-2-SPEECH
```

---

## 🎨 Step 2: Setup Frontend (React Application)

### Install Frontend Dependencies:
```bash
# Navigate to frontend directory
cd frontend

# Install all npm packages
npm install

# This will install:
# - React 19.2.0
# - TensorFlow.js 4.22.0
# - Tailwind CSS 3.4.18
# - lucide-react (icons)
# - Testing libraries
```

### Verify Frontend Installation:
```bash
# Try running the frontend (should work even without backend)
npm start

# The app should open at http://localhost:3000
# Press Ctrl+C to stop
```

---

## 🐍 Step 3: Setup Python Backend (Flask API)

### Create Python Virtual Environment (Recommended):

**On macOS/Linux:**
```bash
# Navigate to model-training directory
cd ../model-training

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# You should see (venv) in your terminal prompt
```

**On Windows:**
```bash
# Navigate to model-training directory
cd ..\model-training

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# You should see (venv) in your terminal prompt
```

### Install Python Dependencies:
```bash
# Make sure virtual environment is activated!
# You should see (venv) in your prompt

# Install all required packages
pip install flask flask-cors tensorflow opencv-python numpy scikit-learn matplotlib Pillow

# Or install from requirements file:
pip install -r requirements.txt

# Additional requirements for Flask API:
pip install tensorflow-macos tensorflow-metal  # For Apple Silicon Macs only
```

### Verify Python Installation:
```bash
# Check installed packages
pip list

# Should show:
# Flask, flask-cors, tensorflow, opencv-python, numpy, etc.
```

---

## 🤖 Step 4: Verify Model Files

The trained model should already be included in the repository:

```bash
# Check if model exists
ls -lh ../frontend/public/models/best_model.h5

# Expected: A file around 33 MB
```

If the model file is missing, you'll need to:
1. Download it from the repository releases
2. Or train a new model using the training notebooks

---

## ▶️ Step 5: Run the Application

You need **TWO terminal windows** running simultaneously:

### Terminal 1: Flask API Server (Backend)

```bash
# Navigate to model-training directory
cd model-training

# Activate virtual environment
source venv/bin/activate          # macOS/Linux
# OR
venv\Scripts\activate              # Windows

# Run the API server
python api_server_asl.py

# You should see:
# ✓ Model loaded from ../frontend/public/models/best_model.h5
# ✓ Server ready!
# * Running on http://127.0.0.1:5001
```

**Keep this terminal running!**

### Terminal 2: React Frontend

```bash
# Navigate to frontend directory (in a NEW terminal)
cd frontend

# Start the React app
npm start

# Browser should automatically open to:
# http://localhost:3000
```

**Keep this terminal running too!**

---

## 🎯 Step 6: Test the Application

### Test Sign Language to Speech:
1. Go to **Sign Language to Speech Conversion** tab
2. Click **"Start Camera"**
3. Allow camera permissions
4. Show sign language gestures to the camera
5. Hold each sign for 1.5 seconds
6. Enable **"Auto Speak"** to hear detected letters/words
7. Use sign '0' or pause to complete words

### Test Speech to Sign Language:
1. Go to **Speech to Sign** tab
2. Click **"Start Recording"**
3. Allow microphone permissions
4. Speak words clearly
5. See letters displayed as sign language images in grid format

---

## 🛠️ Troubleshooting

### Issue: "Module not found" errors in Python

**Solution:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: "Cannot find model file"

**Solution:**
```bash
# Check if model exists
ls frontend/public/models/best_model.h5

# If missing, download from repository or train new model
```

### Issue: Frontend won't connect to backend

**Solution:**
1. Make sure Flask API is running on port 5001
2. Check console for CORS errors
3. Verify `signLanguageModel.js` has correct API URL: `http://localhost:5001`

### Issue: Camera not working

**Solution:**
1. Check browser permissions (allow camera access)
2. Try different browser (Chrome/Edge recommended)
3. Make sure no other app is using the camera

### Issue: "npm install" fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Python version conflicts

**Solution:**
```bash
# Use specific Python version
python3.11 -m venv venv

# Or install pyenv to manage multiple Python versions
```

---

## 📦 Quick Setup Script

### For macOS/Linux:

Create a file `setup.sh`:
```bash
#!/bin/bash

echo "🚀 Setting up SIGN-2-SPEECH..."

# Setup frontend
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Setup backend
echo "🐍 Setting up Python environment..."
cd model-training
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install flask flask-cors

echo "✅ Setup complete!"
echo ""
echo "To run the project:"
echo "  Terminal 1: cd model-training && source venv/bin/activate && python api_server_asl.py"
echo "  Terminal 2: cd frontend && npm start"
```

Run it:
```bash
chmod +x setup.sh
./setup.sh
```

### For Windows:

Create a file `setup.bat`:
```batch
@echo off
echo Setting up SIGN-2-SPEECH...

echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo Setting up Python environment...
cd model-training
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
pip install flask flask-cors

echo Setup complete!
echo.
echo To run the project:
echo   Terminal 1: cd model-training ^&^& venv\Scripts\activate ^&^& python api_server_asl.py
echo   Terminal 2: cd frontend ^&^& npm start
```

Run it:
```batch
setup.bat
```

---

## 🌐 Deployment Options

### Deploy Frontend (React):
- **Vercel**: `vercel deploy`
- **Netlify**: Drag & drop `build` folder
- **GitHub Pages**: Use `gh-pages` package

### Deploy Backend (Flask):
- **Heroku**: Use Procfile
- **Railway**: Connect Git repo
- **AWS EC2**: Manual server setup
- **Google Cloud Run**: Containerize with Docker

---

## 📱 System Requirements

### Minimum:
- **RAM**: 4 GB
- **CPU**: Dual-core processor
- **Storage**: 500 MB free space
- **Internet**: Required for initial setup

### Recommended:
- **RAM**: 8 GB or more
- **CPU**: Quad-core processor (for faster model inference)
- **GPU**: Optional (for training models)
- **Webcam**: 720p or higher

---

## 🔗 Useful Commands

### Start Development:
```bash
# Terminal 1 (Backend)
cd model-training && source venv/bin/activate && python api_server_asl.py

# Terminal 2 (Frontend)
cd frontend && npm start
```

### Stop Servers:
```bash
# In each terminal, press:
Ctrl + C
```

### Update Dependencies:
```bash
# Frontend
cd frontend && npm update

# Backend
cd model-training && pip install --upgrade -r requirements.txt
```

### Check Ports:
```bash
# Check if port 3000 is in use (frontend)
lsof -ti:3000

# Check if port 5001 is in use (backend)
lsof -ti:5001

# Kill process on port (if needed)
kill -9 $(lsof -ti:3000)
```

---

## 📚 Additional Resources

- **React Documentation**: https://react.dev/
- **Flask Documentation**: https://flask.palletsprojects.com/
- **TensorFlow.js**: https://www.tensorflow.org/js
- **Web Speech API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

---

## ✅ Checklist

Before running the project, make sure:

- [ ] Node.js and npm are installed
- [ ] Python 3.8+ is installed
- [ ] Git is installed
- [ ] Repository is cloned
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Python virtual environment created
- [ ] Python dependencies installed (`pip install`)
- [ ] Model file exists (`best_model.h5`)
- [ ] Flask API server is running (port 5001)
- [ ] React frontend is running (port 3000)
- [ ] Camera permissions granted
- [ ] Microphone permissions granted (for speech features)

---

## 🎉 You're All Set!

If you followed all steps correctly, you should now have:
- ✅ React frontend running on `http://localhost:3000`
- ✅ Flask API running on `http://localhost:5001`
- ✅ Sign language detection working
- ✅ Speech to sign language working
- ✅ Text-to-speech functionality working

**Enjoy using SIGN-2-SPEECH! 🤟➡️🔊**

---

## 💡 Need Help?

If you encounter issues:
1. Check the **Troubleshooting** section above
2. Review terminal error messages
3. Open an issue on GitHub
4. Check browser console for errors (F12)

**Last Updated**: November 20, 2025
