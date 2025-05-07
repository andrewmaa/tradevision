# TradeVision

TradeVision is a stock tracking and analysis platform with a Next.js frontend and Flask backend.

## Project Structure

\`\`\`
tradevision/
├── app/                  # Next.js frontend
│   ├── api/              # Frontend API services
│   ├── components/       # React components
│   └── ...               # Other Next.js files
├── backend/              # Flask backend
│   ├── app.py            # Main Flask application
│   ├── config.py         # Configuration
│   └── requirements.txt  # Python dependencies
└── README.md             # Project documentation
\`\`\`

## Setup Instructions

### Frontend (Next.js)

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Create a `.env.local` file with:
   \`\`\`
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   \`\`\`

3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. For production build:
   \`\`\`bash
   npm run build
   npm run start
   \`\`\`

### Backend (Flask)

1. Create a virtual environment:
   \`\`\`bash
   cd backend
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. Run the Flask server:
   \`\`\`bash
   python app.py
   \`\`\`

## Running Both Together

For development, you'll need to run both servers:

1. Terminal 1: Run the Flask backend
   \`\`\`bash
   cd backend
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   python app.py
   \`\`\`

2. Terminal 2: Run the Next.js frontend
   \`\`\`bash
   npm run dev
   \`\`\`

3. Access the application at http://localhost:3000

## Deployment

### Frontend

The Next.js frontend can be deployed to Vercel:

\`\`\`bash
npm run build
vercel --prod
\`\`\`

### Backend

The Flask backend can be deployed to platforms like Heroku, Railway, or any other Python-supporting platform:

\`\`\`bash
# Example for Heroku
heroku create
git subtree push --prefix backend heroku main
\`\`\`

Remember to update the `NEXT_PUBLIC_API_URL` environment variable in your frontend deployment to point to your deployed backend URL.
\`\`\`

Finally, let's create a simple script to run both servers together:

```python file="run.py"
import subprocess
import os
import sys
import time
import webbrowser
from threading import Thread

def run_backend():
    """Run the Flask backend server"""
    os.chdir('backend')
    
    # Determine the Python executable to use
    if os.path.exists('venv/bin/python'):  # macOS/Linux
        python_path = 'venv/bin/python'
    elif os.path.exists('venv/Scripts/python.exe'):  # Windows
        python_path = 'venv/Scripts/python.exe'
    else:
        python_path = 'python'  # Use system Python
    
    subprocess.run([python_path, 'app.py'])

def run_frontend():
    """Run the Next.js frontend server"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    subprocess.run(['npm', 'run', 'dev'])

if __name__ == '__main__':
    print("Starting TradeVision...")
    
    # Start backend in a separate thread
    backend_thread = Thread(target=run_backend)
    backend_thread.daemon = True
    backend_thread.start()
    
    # Give the backend a moment to start
    print("Starting backend server...")
    time.sleep(2)
    
    # Open the browser
    print("Opening browser...")
    webbrowser.open('http://localhost:3000')
    
    # Run frontend in the main thread
    print("Starting frontend server...")
    run_frontend()
