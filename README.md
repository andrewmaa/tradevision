# TradeVision

TradeVision is a stock tracking and analysis platform with a Next.js frontend and Flask backend.

[Live website can be found here.](https://tradevision-nyu.vercel.app)

## Project Structure

```
tradevision/
├── app/                  # Next.js frontend
│   ├── api/             # Frontend API services
│   ├── components/      # React components
│   └── ...             # Other Next.js files
├── backend/             # Flask backend
│   ├── app.py          # Main Flask application
│   ├── config.py       # Configuration
│   └── requirements.txt # Python dependencies
└── README.md           # Project documentation
```

## Setup Instructions

### Frontend (Next.js)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. For production build:
   ```bash
   npm run build
   npm run start
   ```

### Backend (Flask + APIs)

1. Create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the Flask server:
   ```bash
   python app.py
   ```

4. Create a `.env` file with:
   ```
   AV-SECRET=""
   FINNHUB_API_KEY=""
   NEWS_API_KEY=""
   NGROK_TOKEN=""
   OPENAI_API_KEY=""
   REDDIT_CLIENT_ID=""
   REDDIT_CLIENT_SECRET=""
   REDDIT_USER_AGENT=""
   ALPHA_VANTAGE_API_KEY=""
   ```

## Running Both Together

For development, you'll need to run both servers:

1. Terminal 1: Run the Flask backend
   ```bash
   cd backend
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   python app.py
   ```

2. Terminal 2: Run the Next.js frontend
   ```bash
   npm run dev
   ```

3. Access the application at http://localhost:3000

## Deployment

### Frontend

The Next.js frontend can be deployed to Vercel:

```bash
npm run build
vercel --prod
```


### Backend

The Flask backend can be deployed to platforms like Heroku, Railway, or any other Python-supporting platform:

```bash
# Example for Heroku
heroku create
git subtree push --prefix backend heroku main
```

Remember to update the `NEXT_PUBLIC_API_URL` environment variable in your frontend deployment to point to your deployed backend URL.
