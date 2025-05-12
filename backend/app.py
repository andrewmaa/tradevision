# Standard library imports
import os
import sys
import json
import tempfile
import logging
from io import StringIO
from datetime import date, datetime, timedelta, timezone
from dateutil import parser

# Third-party imports
import nltk
import praw
import finnhub
import openai
import pandas as pd
import pymysql
import requests
import matplotlib.pyplot as plt
import seaborn as sns
from dotenv import load_dotenv
from flask import Flask, request, jsonify, make_response, Response, stream_with_context
from flask_cors import CORS
from sqlalchemy import create_engine, text
from curl_cffi import requests as curl_requests
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import yfinance as yf

# Load environment variables
load_dotenv()  # This will load variables from a .env file if present

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configure NLTK data directory for serverless environment
nltk_data_dir = os.getenv('NLTK_DATA', tempfile.gettempdir())
nltk.data.path.append(nltk_data_dir)

# Download NLTK data if not present
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', download_dir=nltk_data_dir)
try:
    nltk.data.find('sentiment/vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon', download_dir=nltk_data_dir)
try:
    nltk.data.find('taggers/averaged_perceptron_tagger')
except LookupError:
    nltk.download('averaged_perceptron_tagger', download_dir=nltk_data_dir)
try:
    nltk.data.find('chunkers/maxent_ne_chunker')
except LookupError:
    nltk.download('maxent_ne_chunker', download_dir=nltk_data_dir)
try:
    nltk.data.find('corpora/words')
except LookupError:
    nltk.download('words', download_dir=nltk_data_dir)

# Configure PyMySQL
pymysql.install_as_MySQLdb()

# Initialize API clients and keys
finnhub_client = finnhub.Client(os.environ.get("FINNHUB_API_KEY"))
api_key = os.environ.get("NEWS_API_KEY")
openai_api_key = os.environ.get("OPENAI_API_KEY")
reddit_client_id = os.environ.get("REDDIT_CLIENT_ID")
reddit_client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
reddit_user_agent = os.environ.get("REDDIT_USER_AGENT")
alpha_vantage_api_key = os.environ.get("ALPHA_VANTAGE_API_KEY")

try:
    # Use pymysql explicitly in the connection string
    conn_string = 'mysql+pymysql://{user}:{password}@{host}:{port}/{db}?charset=utf8mb4'.format(
        user='TradeVision',
        password='ySozy+aJMDsFZtgReErw8A==',
        host='jsedocc7.scrc.nyu.edu',
        port=3306,
        db='TradeVision'
    )
    engine = create_engine(conn_string, pool_recycle=3600)
    
    # Test the connection
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        logger.info("Database connection successful!")
except Exception as e:
    logger.error(f"Error connecting to database: {e}")
    engine = None  # Set engine to None if connection fails

import finnhub
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import time

# Initialize Finnhub client
finnhub_client = finnhub.Client(os.environ.get("FINNHUB_API_KEY"))
api_key = os.environ.get("NEWS_API_KEY")
openai_api_key = os.environ.get("OPENAI_API_KEY")
reddit_client_id = os.environ.get("REDDIT_CLIENT_ID")
reddit_client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
reddit_user_agent = os.environ.get("REDDIT_USER_AGENT")

def get_company_info(ticker_symbol):
    """
    Get basic company info from the ticker symbol using Finnhub
    """
    try:
        # Get company profile
        profile = finnhub_client.company_profile2(symbol=ticker_symbol)

        # Basic error checking
        if not profile or not profile.get("name"):
            print(f"No profile data found for {ticker_symbol}")
            return {
                "error": f"Invalid ticker symbol: {ticker_symbol}",
                "name": ticker_symbol,
                "ticker": ticker_symbol
            }

        try:
          df_company = pd.DataFrame([profile])
          with engine.begin() as conn:
            conn.execute(text("DELETE FROM company_info WHERE ticker = :ticker"), {"ticker": ticker_symbol})
            df_company.to_sql("company_info", con=conn, if_exists="append", index=False)
          print("Data successfully pushed to the database.")
        except Exception as e:
            print(f"Error pushing data to the database: {e}")

        return {
            "name": profile.get("name", ticker_symbol),
            "sector": profile.get("finnhubIndustry", "Unknown"),
            "industry": profile.get("finnhubIndustry", "Unknown"),
            "ticker": ticker_symbol,
            "country": profile.get("country", "Unknown"),
            "exchange": profile.get("exchange", "Unknown"),
            "ipo": profile.get("ipo", "Unknown"),
            "marketCap": float(profile.get("marketCapitalization", 0)),
            "url": profile.get("weburl", "")
        }
    except Exception as e:
        print(f"Error retrieving company info: {e}")
        return {
            "error": f"Error retrieving data for {ticker_symbol}: {str(e)}",
            "name": ticker_symbol,
            "ticker": ticker_symbol
        }

def get_company_news(ticker_symbol, from_days=7):
    """
    Get company news from Finnhub

    Parameters:
        ticker_symbol (str): Stock ticker symbol
        from_days (int): Number of days to look back
    """
    try:
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=from_days)

        # Format dates for Finnhub (YYYY-MM-DD)
        from_date = start_date.strftime('%Y-%m-%d')
        to_date = end_date.strftime('%Y-%m-%d')

        # Get company news
        news = finnhub_client.company_news(ticker_symbol, _from=from_date, to=to_date)

        # Process news
        processed_news = []
        for article in news[:10]:  # Limit to 10 most recent
            processed_news.append({
                "headline": article.get("headline", ""),
                "summary": article.get("summary", ""),
                "url": article.get("url", ""),
                "source": article.get("source", ""),
                "datetime": datetime.fromtimestamp(article.get("datetime", 0)),
                "related": article.get("related", "")
            })

        return processed_news

    except Exception as e:
        print(f"Error retrieving company news: {e}")
        return []

"""# Yahoo Finance"""

import yfinance as yf
import pandas as pd


def get_financial_data(ticker_symbol, period="1mo"):
    """
    Fetching financial data of a company
    """
    try:
        # Create a session with Chrome impersonation using curl_requests
        session = curl_requests.Session(
            impersonate="chrome110",
            timeout=30,
            verify=True
        )
        
        # Configure headers to mimic a real browser
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
        })

        print("DEBUG: Creating Ticker with session")
        company = yf.Ticker(ticker_symbol, session=session)
        
        # Get company description
        stock = yf.Ticker(ticker_symbol, session=session)
        description = stock.info.get('longBusinessSummary', 'No description available')
        
        print("DEBUG: Fetching historical data")
        # Use a longer period to ensure we have enough data
        hist = company.history(period="2mo", interval="1d")
        print("DEBUG: Historical data shape:", hist.shape)
        print("DEBUG: Historical data columns:", hist.columns)
        print("DEBUG: Historical data index:", hist.index)
        print("DEBUG: Historical data sample:", hist.head())
        print("DEBUG: Last 5 dates:", hist.index[-5:])

        if hist.empty:
            print(f"No historical data found for {ticker_symbol}")
            return {
                "ticker": ticker_symbol,
                "error": f"No historical data found for {ticker_symbol}"
            }

        # daily metrics
        latest = hist.iloc[-1]
        prev_day = hist.iloc[-2]

        # calculating volatility (20-day std dev of return)
        returns = hist['Close'].pct_change()
        volatility = returns.std() * (256 ** 0.5) # annualized

        # Convert historical data to dictionary format with proper date formatting
        historical_data = {}
        for date, row in hist.iterrows():
            # Handle timezone-aware timestamps
            if date.tzinfo is not None:
                # If timestamp is timezone-aware, convert to EST
                est_date = date.tz_convert('US/Eastern')
            else:
                # If timestamp is naive, assume UTC and convert to EST
                est_date = date.tz_localize('UTC').tz_convert('US/Eastern')
            
            date_str = est_date.strftime('%Y-%m-%d')
            historical_data[date_str] = {
                'Open': float(row['Open']),
                'High': float(row['High']),
                'Low': float(row['Low']),
                'Close': float(row['Close']),
                'Volume': float(row['Volume'])
            }

        print("DEBUG: Processed historical data keys:", list(historical_data.keys())[-5:])  # Show last 5 dates

        data = {
            "ticker": ticker_symbol,
            "current_price": float(latest['Close']),
            "opening_price": float(latest['Open']),
            "daily_high": float(latest['High']),
            "daily_low": float(latest['Low']),
            "price_change": float(((latest["Close"] - prev_day['Close']) / prev_day['Close']) * 100),
            "trading_volume": float(latest["Volume"]),
            "volatility": float(volatility),
            "historical_data": historical_data,
            "description": description
        }

        print("DEBUG: Financial data structure:", json.dumps(data, indent=2))
        return data
    except Exception as e:
        import traceback
        print(f"Error retrieving financial data: {e}")
        print(f"Error type: {type(e)}")
        print(f"Error details: {str(e)}")
        print("Full traceback:")
        print(traceback.format_exc())
        return {
            "ticker": ticker_symbol,
            "error": f"Error retrieving financial data: {str(e)}"
        }

"""# NewsAPI"""

def get_news_and_extract_keywords(company_name, ticker_symbol=None, days=2, max_articles=10):
    """
    Scrape news articles from multiple sources and extract keywords

    Parameters:
        company_name (str): Company name for general search
        ticker_symbol (str): Stock ticker for Finnhub API, defaults to None
        days (int): Number of days to look back
        max_articles (int): Maximum number of articles to process
    """
    import requests
    from datetime import datetime, timedelta
    import spacy
    import nltk
    import finnhub
    from nltk.sentiment import SentimentIntensityAnalyzer
    from newspaper import Article
    import nltk


    # Load NLP models
    nlp = spacy.load("en_core_web_lg")
    sia = SentimentIntensityAnalyzer()

    # Calculate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    # Format dates for NewsAPI
    from_date = start_date.strftime('%Y-%m-%d')
    to_date = end_date.strftime('%Y-%m-%d')

    articles_data = []
    all_keywords = []
    all_entities = []

    # Define the process_article function inside to have access to Article
    def process_article(article, articles_data, all_keywords, all_entities, nlp, sia):
        """Helper function to process individual articles"""
        try:
            article_url = article["url"]
            news_article = Article(article_url)  # Now Article is in scope
            news_article.download()
            news_article.parse()
            news_article.nlp()  # This extracts keywords

            # Extract entities using spaCy
            doc = nlp(news_article.text[:5000])  # Limit text size for processing

            # Get named entities
            entities = [(ent.text, ent.label_) for ent in doc.ents]

            # Extract keywords (nouns and proper nouns)
            keywords = [token.text.lower() for token in doc if token.pos_ in ("NOUN", "PROPN")]

            # Add newspaper3k keywords
            if news_article.keywords:
                keywords.extend(news_article.keywords)

            # Remove duplicates
            keywords = list(set(keywords))

            # Get sentiment
            sentiment = sia.polarity_scores(article["title"] + " " + article.get("description", ""))

            article_data = {
                "title": article["title"],
                "ticker": ticker_symbol,
                "company_name": company_name,
                "url": article_url,
                "published_at": article["publishedAt"],
                "source": article.get("source", {}).get("name", "Unknown"),
                "keywords": keywords[:10],  # Top 10 keywords
                "entities": entities,
                "sentiment": sentiment

            }

            articles_data.append(article_data)
            df_articles = pd.DataFrame([{
                "title": article_data["title"],
                "ticker": ticker_symbol,
                "company_name": company_name,
                "url": article_data["url"],
                "published_at": article_data["published_at"],
                "source": article_data["source"],
                "sentiment_neg": article_data["sentiment"]["neg"],
                "sentiment_neu": article_data["sentiment"]["neu"],
                "sentiment_pos": article_data["sentiment"]["pos"],
                "sentiment_compound": article_data["sentiment"]["compound"]
            }])
            df_articles.to_sql("news_articles", con=engine, if_exists="append", index=False)
            all_keywords.extend(keywords)
            all_entities.extend([e[0] for e in entities])

        except Exception as e:
            print(f"Error processing article {article.get('url')}: {e}")

    # 1. Get news from NewsAPI (general news sources)
    if company_name:
        try:
            # Free API key from NewsAPI (limited usage)
            api_key = os.environ.get('NEWS_API_KEY')

            # Make request to NewsAPI
            url = f"https://newsapi.org/v2/everything?q={company_name}&from={from_date}&to={to_date}&sortBy=popularity&apiKey={api_key}"

            response = requests.get(url)
            news_data = response.json()

            # Process each article from NewsAPI
            for article in news_data.get("articles", [])[:max_articles//2]:  # Use half the max articles from each source
                process_article(article, articles_data, all_keywords, all_entities, nlp, sia)

        except Exception as e:
            print(f"Error fetching news from NewsAPI: {e}")

    # 2. Get news from Finnhub API if ticker is provided
    if ticker_symbol:
        try:
            # Initialize Finnhub client
            finnhub_client = finnhub.Client(api_key=os.environ.get('FINNHUB_API_KEY'))

            # Get company news from Finnhub
            finnhub_news = finnhub_client.company_news(ticker_symbol, _from=from_date, to=to_date)

            # Process each article from Finnhub
            for article in finnhub_news[:max_articles//2]:  # Use half the max articles from each source
                finnhub_article = {
                    "title": article.get("headline", ""),
                    "url": article.get("url", ""),
                    "publishedAt": datetime.fromtimestamp(article.get("datetime", 0)).isoformat(),
                    "description": article.get("summary", ""),
                    "source": {"name": article.get("source", "Finnhub")}
                }
                process_article(finnhub_article, articles_data, all_keywords, all_entities, nlp, sia)

        except Exception as e:
            print(f"Error fetching news from Finnhub: {e}")

    # Get most common keywords and entities
    from collections import Counter
    top_keywords = Counter(all_keywords).most_common(20)
    top_entities = Counter(all_entities).most_common(10)

    return {
        "articles": articles_data,
        "top_keywords": top_keywords,
        "top_entities": top_entities
    }

"""# Scoring"""

import numpy as np
from datetime import datetime, timezone
from dateutil.tz import tzutc
import pandas as pd

def calculate_metrics(financial_data, news_data, social_data):
    """Calculate metrics based on financial, news, and social data"""
    scores = {}

    # 1. Financial momentum score (0-100)
    try:
        # Convert historical data to DataFrame for calculations
        hist_df = pd.DataFrame.from_dict(financial_data["historical_data"], orient='index')
        hist_df.index = pd.to_datetime(hist_df.index)
        hist_df = hist_df.sort_index()

        # Price momentum (recent performance vs historical)
        price_change_5d = hist_df['Close'].pct_change(5).iloc[-1] * 100
        price_change_20d = hist_df['Close'].pct_change(20).iloc[-1] * 100

        # Volume momentum (recent volume vs average)
        volume_ratio = hist_df['Volume'].iloc[-1] / hist_df['Volume'].iloc[-20:].mean()

        # Volatility adjustment
        volatility = financial_data.get("volatility", 0.01)
        volatility_score = min(50, (1/volatility) * 10)

        # Combine into financial momentum (0-100)
        financial_momentum = min(100, max(0, (
            (price_change_5d * 3) +
            (price_change_20d * 2) +
            (volume_ratio * 10) +
            volatility_score
        )))

        scores["financial_momentum"] = financial_momentum
    except Exception as e:
        print(f"Error calculating financial momentum: {e}")
        print(f"Error type: {type(e)}")
        print(f"Error details: {str(e)}")
        print(f"Financial data structure: {json.dumps(financial_data, indent=2, default=json_serial)}")
        if 'historical_data' in financial_data:
            print(f"Historical data type: {type(financial_data['historical_data'])}")
            print(f"Historical data sample: {json.dumps(dict(list(financial_data['historical_data'].items())[:2]), indent=2, default=json_serial)}")
        scores["financial_momentum"] = 50

    # 2. News sentiment score (0-100)
    try:
        if news_data.get("articles"):
            # Average sentiment across all articles
            sentiment_values = [article["sentiment"]["compound"] for article in news_data["articles"]]
            avg_sentiment = sum(sentiment_values) / len(sentiment_values)

            # Scale from -1,1 to 0,100
            news_sentiment = (avg_sentiment + 1) * 50

            # Adjust by article count
            article_count_factor = min(1.5, max(0.5, len(news_data["articles"]) / 10))
            news_sentiment = min(100, max(0, news_sentiment * article_count_factor))

            scores["news_sentiment"] = news_sentiment
        else:
            scores["news_sentiment"] = 50
    except Exception as e:
        print(f"Error calculating news sentiment: {e}")
        scores["news_sentiment"] = 50

    # 3. Social media buzz score (0-100)
    try:
        if social_data.get("posts"):
            # Basic social sentiment
            social_sentiment = (social_data["avg_sentiment"] + 1) * 50

            # Volume factor
            post_volume = min(2.0, max(0.5, social_data["total_posts"] / 50))

            # Recent post ratio
            now = datetime.now(timezone.utc)


            recent_posts = [p for p in social_data["posts"]
                if isinstance(p.get("created_at"), (datetime, np.datetime64)) and
                  p["created_at"].replace(tzinfo=tzutc()) > (now - timedelta(hours=24))
            ]
            recency_factor = min(1.5, max(0.5, len(recent_posts) / max(1, len(social_data["posts"])) * 3))

            # Engagement factor
            engagements = [p.get("engagement", 0) for p in social_data["posts"]]
            avg_engagement = sum(engagements) / max(1, len(engagements))
            engagement_factor = min(2.0, max(0.5, avg_engagement / 10))

            # Combined social buzz score
            social_buzz = min(100, max(0, social_sentiment * post_volume * recency_factor * engagement_factor))

            scores["social_buzz"] = social_buzz
        else:
            scores["social_buzz"] = 0
    except Exception as e:
        print(f"Error calculating social buzz: {e}")
        scores["social_buzz"] = 0

    # 4. Combined "Hype Index"
    try:
        # Adjusted weights to give more importance to financial momentum
        hype_index = (
            (scores["financial_momentum"] * 0.6) +  
            (scores["news_sentiment"] * 0.2) +     
            (scores["social_buzz"] * 0.2)           
        )

        scores["hype_index"] = hype_index
    except Exception as e:
        print(f"Error calculating hype index: {e}")
        scores["hype_index"] = 50

    # 5. Sentiment-Price Divergence
    try:
        # Use the same DataFrame we created for financial momentum
        price_change_3d = hist_df['Close'].pct_change(3).iloc[-1] * 100
        combined_sentiment = (scores["news_sentiment"] + scores["social_buzz"]) / 2

        # Normalize price change to 0-100 scale
        norm_price = min(100, max(0, (price_change_3d + 10) * 5))

        # Calculate divergence (price - sentiment)
        # Positive means price is higher than sentiment (bearish divergence)
        # Negative means price is lower than sentiment (bullish divergence)
        sentiment_price_divergence = norm_price - combined_sentiment
        scores["sentiment_price_divergence"] = sentiment_price_divergence
    except Exception as e:
        print(f"Error calculating sentiment-price divergence: {e}")
        print(f"Error type: {type(e)}")
        print(f"Error details: {str(e)}")
        scores["sentiment_price_divergence"] = 0

    return scores

"""# Expand Keywords"""

import openai
import json

def expand_keywords_and_generate_queries(keywords, company_name, industry):
    keyword_text = ", ".join(keywords[:10])

    prompt = f"""
    Given the company "{company_name}" in the {industry} industry and the keywords [{keyword_text}],
    please provide:

    1. An expanded list of EXACTLY 15 related keywords, industry terms, and trending topics. Include:
       - Industry-specific terminology
       - Financial metrics relevant to this company
       - Recent product/service names
       - Competitor-related terms
       - Market trends affecting this company

    2. 5 semantic search queries that could be used to find relevant social media discussions.

    Only output a JSON object with the following format:

    {{
      "expanded_keywords": ["keyword1", "keyword2", "keyword3", ...],
      "search_queries": ["query1", "query2", "query3", "query4", "query5"]
    }}
    """

    try:
        client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that expands keywords and generates search queries."},
                {"role": "user", "content": prompt.strip()}
            ],
            temperature=0.7,
            max_tokens=800
        )

        content = response.choices[0].message.content
        result = json.loads(content)

        return {
            "expanded_keywords": result.get("expanded_keywords", []),
            "search_queries": result.get("search_queries", [])
        }

    except Exception as e:
        print(f"Error with OpenAI keyword expansion: {e}")
        return {
            "expanded_keywords": keywords,
            "search_queries": [f"{company_name} {kw}" for kw in keywords[:5]]
        }

"""# Reddit and Bluesky"""

import requests
import praw
import pandas as pd
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from configparser import ConfigParser
import asyncio
import time

def fetch_bluesky_posts_and_analyze(company_name, search_queries, analyzer, max_results=100):
    logger.info(f"Starting Bluesky post fetch for {company_name}")
    BLUESKY_API = "https://bsky.social/xrpc"
    identifier = "tradevision.bsky.social"
    password = "Bluesky!"

    try:
        logger.info("Attempting Bluesky authentication")
        auth_response = requests.post(
            f"{BLUESKY_API}/com.atproto.server.createSession",
            json={"identifier": identifier, "password": password},
        )
        auth_response.raise_for_status()
        access_token = auth_response.json()["accessJwt"]
        logger.info("Successfully authenticated with Bluesky")
    except Exception as e:
        logger.error(f"Bluesky auth failed: {e}")
        return []

    headers = {"Authorization": f"Bearer {access_token}"}
    all_posts = []

    for query in search_queries:
        try:
            logger.info(f"Searching Bluesky for query: {query}")
            response = requests.get(
                f"{BLUESKY_API}/app.bsky.feed.searchPosts",
                headers=headers,
                params={"q": query, "limit": max_results},
            )
            response.raise_for_status()
            posts = response.json().get("posts", [])
            logger.info(f"Found {len(posts)} posts for query: {query}")

            for post in posts:
                text = post.get("record", {}).get("text", "")
                sentiment = analyzer.polarity_scores(text)
                all_posts.append({
                    "platform": "Bluesky",
                    "text": text,
                    "created_at": pd.Timestamp(post.get("indexedAt", pd.Timestamp.now())),
                    "username": post.get("author", {}).get("handle", "unknown"),
                    "likes": 0,
                    "comments": 0,
                    "engagement": 0,
                    "url": f"https://bsky.app/profile/{post['author']['handle']}",
                    "subreddit": "n/a",
                    "sentiment_score": sentiment["compound"],
                    "sentiment_category": "positive" if sentiment["compound"] > 0.05 else "negative" if sentiment["compound"] < -0.05 else "neutral"
                })
        except Exception as e:
            logger.error(f"Bluesky search failed for '{query}': {e}")
            continue

    logger.info(f"Total Bluesky posts collected: {len(all_posts)}")
    return all_posts

def scrape_social_media(company_name, search_queries, max_results=100):
    """
    Scrape Reddit for company mentions using the search queries generated by the LLM
    """

    # Initialize sentiment analyzer
    analyzer = SentimentIntensityAnalyzer()
    all_posts = []

    # Function to filter and score posts using VADER (no API costs)
    def filter_and_score_post(post):
        # Calculate sentiment on the combined text
        sentiment = analyzer.polarity_scores(post["text"])
        post["sentiment_score"] = sentiment["compound"]
        post["sentiment_category"] = "positive" if sentiment["compound"] > 0.05 else "negative" if sentiment["compound"] < -0.05 else "neutral"
        return post

    # Reddit scraping using PRAW
    try:
        reddit_client_id = os.environ.get("REDDIT_CLIENT_ID")
        reddit_client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
        reddit_user_agent = os.environ.get("REDDIT_USER_AGENT")

        # Initialize Reddit API
        reddit = praw.Reddit(
            client_id=reddit_client_id,
            client_secret=reddit_client_secret,
            user_agent=reddit_user_agent
        )

        reddit_posts = []
        min_posts_target = 20

        # Calculate the timestamp for one week ago
        one_week_ago = (pd.Timestamp.now() - pd.Timedelta(days=7)).timestamp()

        # Search in relevant subreddits
        subreddits = ["stocks", "investing", "wallstreetbets"]

        # Try to add company subreddit if it exists
        try:
            company_subreddit = reddit.subreddit(company_name.lower())
            # Check if subreddit exists with a quick check
            _ = company_subreddit.created_utc
            subreddits.append(company_name.lower())
        except Exception as e:
            print(f"Company subreddit doesn't exist or is inaccessible: {e}")

        # industry-specific subreddits for better coverage
        industry_subreddits = ["StockMarket", "finance", "economy", "business"]
        subreddits.extend(industry_subreddits)

        print(f"Searching Reddit in subreddits: {subreddits}")

        # Function to fetch posts from a subreddit within time limit
        def get_recent_posts(subreddit_obj, query, limit=30):
            recent_posts = []
            try:
                # First try with search
                for submission in subreddit_obj.search(query, sort="new", time_filter="week", limit=limit):
                    # Skip if post is too old
                    if submission.created_utc < one_week_ago:
                        continue

                    post = {
                        "platform": "Reddit",
                        "title": submission.title,
                        "description": submission.selftext if submission.selftext else "",
                        "text": submission.title + " " + (submission.selftext if submission.selftext else ""),
                        "created_at": pd.to_datetime(submission.created_utc, unit='s').isoformat(),
                        "username": submission.author.name if submission.author and hasattr(submission.author, 'name') else "[deleted]",
                        "likes": submission.score,
                        "comments": submission.num_comments,
                        "engagement": submission.score + submission.num_comments,
                        "url": f"https://www.reddit.com{submission.permalink}",
                        "subreddit": subreddit_obj.display_name
                    }

                    recent_posts.append(post)

                # If we didn't get enough posts, browsing hot/new as well
                if len(recent_posts) < 20:
                    browse_methods = [
                        (subreddit_obj.hot, min(20, limit)),
                        (subreddit_obj.new, min(20, limit))
                    ]

                    for method, method_limit in browse_methods:
                        for submission in method(limit=method_limit):
                            # Skip if post is too old
                            if submission.created_utc < one_week_ago:
                                continue

                            # Skip if post doesn't contain any relevant keywords
                            if not any(query.lower() in submission.title.lower() or
                                    (submission.selftext and query.lower() in submission.selftext.lower())
                                    for query in search_queries):
                                continue

                            post = {
                                "platform": "Reddit",
                                "title": submission.title,
                                "description": submission.selftext if submission.selftext else "",
                                "text": submission.title + " " + (submission.selftext if submission.selftext else ""),
                                "created_at": pd.to_datetime(submission.created_utc, unit='s').isoformat(),
                                "username": submission.author.name if submission.author and hasattr(submission.author, 'name') else "[deleted]",
                                "likes": submission.score,
                                "comments": submission.num_comments,
                                "engagement": submission.score + submission.num_comments,
                                "url": f"https://www.reddit.com{submission.permalink}",
                                "subreddit": subreddit_obj.display_name
                            }

                            # to avoid duplicates
                            if not any(existing["url"] == post["url"] for existing in recent_posts):
                                recent_posts.append(post)
            except Exception as e:
                print(f"Error getting posts from subreddit {subreddit_obj.display_name}: {e}")

            return recent_posts

        # Fetching enough posts across all subreddits
        for subreddit_name in subreddits:
            if len(reddit_posts) >= min_posts_target:
                break

            try:
                subreddit = reddit.subreddit(subreddit_name)
                posts_needed = min_posts_target - len(reddit_posts)

                if posts_needed <= 0:
                    break

                # Try each search query until we have enough posts
                for query in search_queries:
                    new_posts = get_recent_posts(subreddit, query, limit=30)
                    reddit_posts.extend([filter_and_score_post(post) for post in new_posts])

                    print(f"Found {len(new_posts)} posts for query '{query}' in r/{subreddit_name}")

                    if len(reddit_posts) >= min_posts_target:
                        break
            except Exception as e:
                print(f"Error accessing subreddit {subreddit_name}: {e}")
                continue

        print(f"Collected a total of {len(reddit_posts)} Reddit posts")
        bluesky_posts = fetch_bluesky_posts_and_analyze(company_name, search_queries, analyzer)
        all_posts.extend(bluesky_posts)
        all_posts.extend(reddit_posts)
    except Exception as e:
        print(f"Error initializing Reddit API: {e}")

    # Calculate overall metrics
    if all_posts:
        sentiment_scores = [post["sentiment_score"] for post in all_posts]
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)

        sentiment_distribution = {
            "positive": len([s for s in sentiment_scores if s > 0.05]) / len(sentiment_scores),
            "neutral": len([s for s in sentiment_scores if -0.05 <= s <= 0.05]) / len(sentiment_scores),
            "negative": len([s for s in sentiment_scores if s < -0.05]) / len(sentiment_scores)
        }

        # Sort by engagement
        most_engaging_posts = sorted(all_posts, key=lambda x: x.get('engagement', 0), reverse=True)[:10]

        return {
            "posts": all_posts,
            "top_posts": most_engaging_posts,
            "total_posts": len(all_posts),
            "avg_sentiment": avg_sentiment,
            "sentiment_distribution": sentiment_distribution
        }
    else:
        return {
            "posts": [],
            "top_posts": [],
            "total_posts": 0,
            "avg_sentiment": 0,
            "sentiment_distribution": {
                "positive": 0,
                "neutral": 0,
                "negative": 0
            }
        }

"""# Stock Recommendations"""

import requests



def get_alpha_vantage_trending():
    url = f"https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey={alpha_vantage_api_key}"

    try:
        response = requests.get(url, timeout=10)
        data = response.json()


        trending = [
            f"{stock['ticker']} ({stock['price']})"
            for stock in data.get('top_gainers', [])
        ]
        print(trending[0:10])
        return trending[:10]

    except Exception as e:
        print(f"Error with Alpha Vantage: {e}")
        return []




"""# Frontend"""

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError("Type %s not serializable" % type(obj))

def flatten_nested_dict(d, parent_key='', sep='.'):
    """
    Flatten a nested dictionary with custom separator and handle complex data types
    """
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            # Special handling for historical_data to store as JSON
            if k == 'historical_data':
                items.append((new_key, json.dumps(v, default=json_serial)))
            else:
                items.extend(flatten_nested_dict(v, new_key, sep=sep).items())
        elif isinstance(v, (list, tuple)):
            # Convert lists and tuples to JSON strings
            items.append((new_key, json.dumps(v, default=json_serial)))
        elif isinstance(v, (datetime, date)):
            # Convert datetime objects to ISO format strings
            items.append((new_key, v.isoformat()))
        else:
            # Handle all other types
            items.append((new_key, v))
    return dict(items)

def parse_timestamp(timestamp_str):
    """Helper function to parse timestamps from database"""
    if not timestamp_str:
        return None
        
    try:
        # If timestamp is already a datetime object, return it
        if isinstance(timestamp_str, (datetime, date)):
            if timestamp_str.tzinfo is None:
                return timestamp_str.replace(tzinfo=timezone.utc)
            return timestamp_str
            
        # Convert to string if it's not already
        if not isinstance(timestamp_str, str):
            timestamp_str = str(timestamp_str)
            
        # Try parsing as ISO format first
        parsed_time = datetime.fromisoformat(timestamp_str)
        if parsed_time.tzinfo is None:
            parsed_time = parsed_time.replace(tzinfo=timezone.utc)
        return parsed_time
    except ValueError:
        try:
            # Try parsing as MySQL datetime format
            parsed_time = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
            return parsed_time.replace(tzinfo=timezone.utc)
        except ValueError:
            try:
                # Try parsing as MySQL datetime with microseconds
                parsed_time = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S.%f')
                return parsed_time.replace(tzinfo=timezone.utc)
            except ValueError:
                logger.error(f"Could not parse timestamp: {timestamp_str}")
                return None

def run_pipeline(ticker, force_refresh=False):

    """Run complete analysis pipeline and print results at each step"""
    now_utc = datetime.now(timezone.utc)

    # Step 0: Check last run from `data` table
    with engine.connect() as conn:
        print("Checking cache")
        result = conn.execute(
            text("SELECT last_run FROM data WHERE `company_info.ticker` = :ticker ORDER BY last_run DESC LIMIT 1"),
            {"ticker": ticker}
        ).fetchone()

        if result and result[0] and not force_refresh:
            last_run_time = result[0]
            if isinstance(last_run_time, str):
                last_run_time = parser.isoparse(last_run_time)
            if last_run_time.tzinfo is None:
                last_run_time = last_run_time.replace(tzinfo=timezone.utc)
            
            # Check if cache is still valid (less than 1 hour old)
            cache_age = now_utc - last_run_time
            cache_age_hours = cache_age.total_seconds() / 3600
            logger.info(f"Current time (UTC): {now_utc.isoformat()}")
            logger.info(f"Last run time (UTC): {last_run_time.isoformat()}")
            logger.info(f"Cache age: {cache_age_hours:.2f} hours")
            
            if cache_age < timedelta(hours=1):
                logger.info(f"Using cached data (age: {cache_age_hours:.2f} hours)")
                yield send_sse_message({"step": "cache", "status": "success", "message": f"Using cached data (age: {cache_age_hours:.2f} hours)"})
                
                # Debug: Print the data query
                data_query = text("SELECT * FROM data WHERE `company_info.ticker` = :ticker ORDER BY last_run DESC LIMIT 1")
                logger.info(f"Executing data fetch query for ticker: {ticker}")
                
                recent_data = conn.execute(data_query, {"ticker": ticker}).mappings().fetchone()
                logger.info(f"Found cached data: {bool(recent_data)}")

                if recent_data:
                    recent_data_dict = dict(recent_data)
                    logger.info("Reconstructing data structure")
                    reconstructed_data = {}
                    
                    for key, value in recent_data_dict.items():
                        if '.' in key:
                            parts = key.split('.')
                            current = reconstructed_data
                            for part in parts[:-1]:
                                if part not in current:
                                    current[part] = {}
                                current = current[part]
                            current[parts[-1]] = value
                        else:
                            reconstructed_data[key] = value
                    
                    if 'financial_data' in reconstructed_data:
                        if 'historical_data' in reconstructed_data['financial_data']:
                            try:
                                historical_data = json.loads(reconstructed_data['financial_data']['historical_data'])
                                reconstructed_data['financial_data']['historical_data'] = historical_data
                                logger.info("Successfully parsed historical_data")
                            except json.JSONDecodeError as e:
                                logger.error(f"Error parsing historical_data: {e}")
                    
                    # Parse news_data.articles if it exists
                    if 'news_data' in reconstructed_data:
                        try:
                            if isinstance(reconstructed_data['news_data'], str):
                                news_data = json.loads(reconstructed_data['news_data'])
                                reconstructed_data['news_data'] = news_data
                                logger.info("Successfully parsed news_data from string")
                            else:
                                logger.info("news_data is already a dictionary, no parsing needed")
                        except json.JSONDecodeError as e:
                            logger.error(f"Error parsing news_data: {e}")
                    
                    reconstructed_data['last_run'] = last_run_time.isoformat()
                    logger.info("Successfully reconstructed cached data")
                    yield send_sse_message({"step": "complete", "status": "success", "data": reconstructed_data})
                    return
                else:
                    logger.info("No cached data found in database")
                    yield send_sse_message({"step": "cache", "status": "error", "message": "No cached data found"})
            else:
                logger.info(f"Cache expired (age: {cache_age_hours:.2f} hours), running pipeline")
                yield send_sse_message({"step": "cache", "status": "info", "message": f"Cache expired (age: {cache_age_hours:.2f} hours), running pipeline"})
        else:
            print("Force refresh requested, running pipeline")

    # Step 1: Financial data
    print("Fetching company info")
    company_info = get_company_info(ticker)
    
    # Check for error in company info
    if "error" in company_info:
        return {
            "company_info": company_info,
            "error": company_info["error"]
        }

    print(f"Got data for {company_info['name']}")

    # Step 2: Get financial data
    print("Fetching financial data")
    financial_data = get_financial_data(ticker, period="1mo")
    
    # Check for error in financial data
    if "error" in financial_data:
        return {
            "company_info": company_info,
            "financial_data": financial_data,
            "error": financial_data["error"]
        }
        
    print("Got financial data")

    # Step 3: News data
    print("Analyzing news")
    news_data = get_news_and_extract_keywords(company_info['name'], days=2)
    print(f"Found {len(news_data['articles'])} articles")
    print(f"DEBUG: News data structure: {json.dumps(news_data, indent=2, default=json_serial)}")

    # Step 4: Expand keywords with AI
    print("Expanding keywords")
    top_keywords = [k[0] for k in news_data['top_keywords'][:10]]
    expanded_data = expand_keywords_and_generate_queries(company_info['name'], top_keywords, company_info.get('industry', 'N/A'))
    print("Generated search queries")

    # Step 5: Scraping social media
    print("Analyzing social media")
    social_data = scrape_social_media(company_info['name'], expanded_data['search_queries'])
    print(f"Analyzed {social_data['total_posts']} posts")

    # Step 6: Calculate metrics
    print("Calculating metrics")
    scores = calculate_metrics(financial_data, news_data, social_data)
    print("Calculated all scores")

    # Prepare the response structure
    res = {
        "company_info": company_info,
        "financial_data": financial_data,
        "news_data": news_data,
        "expanded_data": expanded_data,
        "social_data": social_data,
        "scores": scores,
        "last_run": now_utc.isoformat()
    }

    try:
        flattened = flatten_nested_dict(res)
        df_flat = pd.DataFrame([flattened])

        with engine.begin() as conn:
            # Delete old data for this ticker
            conn.execute(text("DELETE FROM data WHERE `company_info.ticker` = :ticker"), {"ticker": ticker})
            # Insert new data
            df_flat.to_sql("data", con=conn, if_exists="append", index=False)
            # Return the original res object instead of querying the database again
            return res
    except Exception as e:
        print(f"DEBUG: Error in data processing: {e}")
        print(f"DEBUG: Error type: {type(e)}")
        print(f"DEBUG: Error details: {str(e)}")
        raise

def get_current_price(ticker_symbol):
    """
    Get current stock price using Finnhub
    """
    try:
        # Get quote data from Finnhub
        quote = finnhub_client.quote(ticker_symbol)
        
        if not quote or 'c' not in quote:
            return {
                "error": f"No price data found for {ticker_symbol}",
                "ticker": ticker_symbol
            }
            
        return {
            "ticker": ticker_symbol,
            "current_price": float(quote['c']),
            "change": float(quote['dp']),  # Daily percentage change
            "high": float(quote['h']),     # High price of the day
            "low": float(quote['l']),      # Low price of the day
            "open": float(quote['o']),     # Opening price
            "previous_close": float(quote['pc'])  # Previous closing price
        }
    except Exception as e:
        print(f"Error retrieving current price: {e}")
        return {
            "error": f"Error retrieving data for {ticker_symbol}: {str(e)}",
            "ticker": ticker_symbol
        }

app = Flask(__name__)

# Configure CORS
CORS(app, 
     resources={r"/*": {
         "origins": ["https://tradevision-nyu.vercel.app", "http://localhost:3000", "https://tradevision-production.up.railway.app"],
         "methods": ["GET", "POST", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "Accept"],
         "supports_credentials": True,
         "expose_headers": ["Content-Type", "Authorization"],
         "max_age": 3600,
         "send_wildcard": False,
         "vary_header": True,
         "supports_credentials": True,
         "allow_credentials": True
     }})

# Add CORS headers to all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    # Update to allow both localhost and Railway
    origin = request.headers.get('Origin')
    if origin in ["https://tradevision-nyu.vercel.app", "http://localhost:3000", "https://tradevision-production.up.railway.app"]:
        response.headers.add('Access-Control-Allow-Origin', origin)
    return response

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        db_status = "healthy" if engine is not None else "unhealthy"
        
        # Check environment variables
        env_vars = {
            "FINNHUB_API_KEY": bool(os.environ.get("FINNHUB_API_KEY")),
            "NEWS_API_KEY": bool(os.environ.get("NEWS_API_KEY")),
            "OPENAI_API_KEY": bool(os.environ.get("OPENAI_API_KEY")),
            "REDDIT_CLIENT_ID": bool(os.environ.get("REDDIT_CLIENT_ID")),
            "REDDIT_CLIENT_SECRET": bool(os.environ.get("REDDIT_CLIENT_SECRET")),
            "REDDIT_USER_AGENT": bool(os.environ.get("REDDIT_USER_AGENT"))
        }
        
        return jsonify({
            "status": "healthy",
            "database": db_status,
            "environment_variables": env_vars
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

@app.route('/test', methods=['GET'])
def test():
    return jsonify({"status": "ok", "message": "Backend is working"})

@app.route('/test/yf/<ticker>', methods=['GET'])
def test_yf(ticker):
    """Test endpoint for Yahoo Finance data"""
    try:
        data = get_financial_data(ticker, period="1mo")
        return jsonify({
            "status": "success",
            "data": data
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

def send_sse_message(message, event_type="message"):
    """Helper function to format SSE messages"""
    return f"event: {event_type}\ndata: {json.dumps(message, default=json_serial)}\n\n"

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze stock endpoint with SSE support"""
    try:
        data = request.get_json()
        if not data:
            logger.error("No JSON data received in request")
            return jsonify({
                "error": "No JSON data received",
                "status": "error"
            }), 400

        ticker = data.get('symbol', '').upper()
        if not ticker:
            logger.error("No symbol provided in request")
            return jsonify({
                "error": "No symbol provided",
                "status": "error"
            }), 400

        force_refresh = data.get('force_refresh', False)
        logger.info(f"Starting analysis for {ticker} (force_refresh={force_refresh})")

        def generate():
            try:
                # Check cache first
                now_utc = datetime.now(timezone.utc)
                logger.info(f"Current UTC time: {now_utc.isoformat()}")
                
                with engine.connect() as conn:
                    # Debug: Print the SQL query
                    query = text("SELECT last_run FROM data WHERE `company_info.ticker` = :ticker ORDER BY last_run DESC LIMIT 1")
                    logger.info(f"Executing cache check query for ticker: {ticker}")
                    
                    result = conn.execute(query, {"ticker": ticker}).fetchone()
                    logger.info(f"Cache check result: {result}")

                    # If force refresh is requested, skip cache check and run pipeline
                    if force_refresh:
                        logger.info("Force refresh requested, running pipeline")
                        yield send_sse_message({"step": "cache", "status": "info", "message": "Force refresh requested, running pipeline"})
                    elif result and result[0]:
                        logger.info(f"Found cache entry with last_run: {result[0]}")
                        last_run_time = parse_timestamp(result[0])
                        
                        if last_run_time is None:
                            logger.error(f"Invalid timestamp format in database: {result[0]}")
                            yield send_sse_message({"step": "cache", "status": "error", "message": "Invalid timestamp format in database"})
                            return
                            
                        if last_run_time.tzinfo is None:
                            logger.info("Adding UTC timezone to last_run_time")
                            last_run_time = last_run_time.replace(tzinfo=timezone.utc)
                        
                        # Check if cache is still valid (less than 1 hour old)
                        cache_age = now_utc - last_run_time
                        cache_age_hours = cache_age.total_seconds() / 3600
                        logger.info(f"Current time (UTC): {now_utc.isoformat()}")
                        logger.info(f"Last run time (UTC): {last_run_time.isoformat()}")
                        logger.info(f"Cache age: {cache_age_hours:.2f} hours")
                        
                        if cache_age < timedelta(hours=1):
                            logger.info(f"Using cached data (age: {cache_age_hours:.2f} hours)")
                            yield send_sse_message({"step": "cache", "status": "success", "message": f"Using cached data (age: {cache_age_hours:.2f} hours)"})
                            
                            # Debug: Print the data query
                            data_query = text("SELECT * FROM data WHERE `company_info.ticker` = :ticker ORDER BY last_run DESC LIMIT 1")
                            logger.info(f"Executing data fetch query for ticker: {ticker}")
                            
                            recent_data = conn.execute(data_query, {"ticker": ticker}).mappings().fetchone()
                            logger.info(f"Found cached data: {bool(recent_data)}")

                            if recent_data:
                                recent_data_dict = dict(recent_data)
                                logger.info("Reconstructing data structure")
                                reconstructed_data = {}
                                
                                for key, value in recent_data_dict.items():
                                    if '.' in key:
                                        parts = key.split('.')
                                        current = reconstructed_data
                                        for part in parts[:-1]:
                                            if part not in current:
                                                current[part] = {}
                                            current = current[part]
                                        current[parts[-1]] = value
                                    else:
                                        reconstructed_data[key] = value
                                
                                if 'financial_data' in reconstructed_data:
                                    if 'historical_data' in reconstructed_data['financial_data']:
                                        try:
                                            historical_data = json.loads(reconstructed_data['financial_data']['historical_data'])
                                            reconstructed_data['financial_data']['historical_data'] = historical_data
                                            logger.info("Successfully parsed historical_data")
                                        except json.JSONDecodeError as e:
                                            logger.error(f"Error parsing historical_data: {e}")
                                
                                # Parse news_data.articles if it exists
                                if 'news_data' in reconstructed_data:
                                    try:
                                        if isinstance(reconstructed_data['news_data'], str):
                                            news_data = json.loads(reconstructed_data['news_data'])
                                            reconstructed_data['news_data'] = news_data
                                            logger.info("Successfully parsed news_data from string")
                                        else:
                                            logger.info("news_data is already a dictionary, no parsing needed")
                                    except json.JSONDecodeError as e:
                                        logger.error(f"Error parsing news_data: {e}")
                                
                                reconstructed_data['last_run'] = last_run_time.isoformat()
                                logger.info("Successfully reconstructed cached data")
                                yield send_sse_message({"step": "complete", "status": "success", "data": reconstructed_data})
                                return
                            else:
                                logger.info("No cached data found in database")
                                yield send_sse_message({"step": "cache", "status": "error", "message": "No cached data found"})
                        else:
                            logger.info(f"Cache expired (age: {cache_age_hours:.2f} hours), running pipeline")
                            yield send_sse_message({"step": "cache", "status": "info", "message": f"Cache expired (age: {cache_age_hours:.2f} hours), running pipeline"})
                    else:
                        logger.info("No cache found, running pipeline")
                        yield send_sse_message({"step": "cache", "status": "info", "message": "No cache found, running pipeline"})

                # Only run pipeline if cache is expired or no cache exists
                if force_refresh or not result or not result[0] or cache_age >= timedelta(hours=1):
                    # Step 1: Financial data
                    logger.info("Starting company info fetch")
                    yield send_sse_message({"step": "company_info", "status": "started", "message": "Fetching company info"})
                    company_info = get_company_info(ticker)
                    
                    if "error" in company_info:
                        logger.error(f"Error in company info: {company_info['error']}")
                        yield send_sse_message({"step": "company_info", "status": "error", "message": company_info["error"]})
                        return

                    logger.info(f"Got company info for {company_info['name']}")
                    yield send_sse_message({"step": "company_info", "status": "success", "message": f"Got data for {company_info['name']}"})

                    # Step 2: Get financial data
                    logger.info("Starting financial data fetch")
                    yield send_sse_message({"step": "financial_data", "status": "started", "message": "Fetching financial data"})
                    financial_data = get_financial_data(ticker, period="1mo")
                    
                    if "error" in financial_data:
                        logger.error(f"Error in financial data: {financial_data['error']}")
                        yield send_sse_message({"step": "financial_data", "status": "error", "message": financial_data["error"]})
                        return
                        
                    logger.info("Got financial data")
                    yield send_sse_message({"step": "financial_data", "status": "success", "message": "Got financial data"})

                    # Step 3: News data
                    logger.info("Starting news analysis")
                    yield send_sse_message({"step": "news", "status": "started", "message": "Analyzing news"})
                    news_data = get_news_and_extract_keywords(company_info['name'], days=2)
                    logger.info(f"Found {len(news_data['articles'])} articles")
                    yield send_sse_message({"step": "news", "status": "success", "message": f"Found {len(news_data['articles'])} articles"})

                    # Step 4: Expand keywords with AI
                    logger.info("Starting keyword expansion")
                    yield send_sse_message({"step": "keywords", "status": "started", "message": "Expanding keywords"})
                    top_keywords = [k[0] for k in news_data['top_keywords'][:10]]
                    expanded_data = expand_keywords_and_generate_queries(company_info['name'], top_keywords, company_info.get('industry', 'N/A'))
                    logger.info("Generated search queries")
                    yield send_sse_message({"step": "keywords", "status": "success", "message": "Generated search queries"})

                    # Step 5: Scraping social media
                    logger.info("Starting social media analysis")
                    yield send_sse_message({"step": "social", "status": "started", "message": "Analyzing social media"})
                    social_data = scrape_social_media(company_info['name'], expanded_data['search_queries'])
                    logger.info(f"Analyzed {social_data['total_posts']} posts")
                    yield send_sse_message({"step": "social", "status": "success", "message": f"Analyzed {social_data['total_posts']} posts"})

                    # Step 6: Calculate metrics
                    logger.info("Starting metrics calculation")
                    yield send_sse_message({"step": "metrics", "status": "started", "message": "Calculating metrics"})
                    scores = calculate_metrics(financial_data, news_data, social_data)
                    logger.info("Calculated all scores")
                    yield send_sse_message({"step": "metrics", "status": "success", "message": "Calculated all scores"})

                    # Prepare the response structure
                    res = {
                        "company_info": company_info,
                        "financial_data": financial_data,
                        "news_data": news_data,
                        "expanded_data": expanded_data,
                        "social_data": social_data,
                        "scores": scores,
                        "last_run": now_utc.isoformat()
                    }

                    try:
                        flattened = flatten_nested_dict(res)
                        df_flat = pd.DataFrame([flattened])

                        with engine.begin() as conn:
                            conn.execute(text("DELETE FROM data WHERE `company_info.ticker` = :ticker"), {"ticker": ticker})
                            df_flat.to_sql("data", con=conn, if_exists="append", index=False)
                            yield send_sse_message({"step": "complete", "status": "success", "data": res})
                    except Exception as e:
                        error_msg = f"Error in data processing: {str(e)}"
                        logger.error(error_msg)
                        yield send_sse_message({"step": "complete", "status": "error", "message": error_msg})
                        raise

            except Exception as e:
                error_msg = f"Error in pipeline: {str(e)}"
                logger.error(error_msg)
                yield send_sse_message({"step": "complete", "status": "error", "message": error_msg})
                raise

        return Response(
            stream_with_context(generate()),
            content_type='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        )

    except Exception as e:
        logger.error(f"Error in analyze endpoint: {str(e)}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "status": "error"
        }), 500

@app.route('/api/price/<ticker>', methods=['GET'])
def get_price(ticker):
    """Get current stock price endpoint"""
    try:
        data = get_current_price(ticker)
        return jsonify({
            "status": "success",
            "data": data
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

@app.route('/api/market/trending', methods=['GET'])
def get_trending_stocks():
    """Get trending stocks from Alpha Vantage with caching"""
    try:
        # Check cache in database
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM market_trends WHERE DATE(last_updated) = CURDATE()")
            ).fetchone()

            if result:
                # Return cached data
                return jsonify({
                    "status": "success",
                    "data": json.loads(result.trending_data)
                })

        # If no cache or cache is old, fetch new data
        url = f"https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey={alpha_vantage_api_key}"
        logger.info(f"Fetching trending stocks from Alpha Vantage")
        response = requests.get(url, timeout=10)
        data = response.json()
        logger.info(f"Alpha Vantage response: {data}")

        if 'top_gainers' not in data:
            logger.error(f"No top_gainers in response: {data}")
            return jsonify({
                "status": "error",
                "error": "No trending stocks data available"
            }), 500

        trending = []
        for stock in data.get('top_gainers', [])[:10]:
            try:
                # Get company overview from Alpha Vantage
                overview_url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={stock['ticker']}&apikey={alpha_vantage_api_key}"
                logger.info(f"Fetching overview for {stock['ticker']}")
                overview_response = requests.get(overview_url, timeout=10)
                overview_data = overview_response.json()
                logger.info(f"Overview response for {stock['ticker']}: {overview_data}")

                # Handle potential missing fields
                price = stock.get('price', '0')
                change_amount = stock.get('change_amount', '0')
                change_percentage = stock.get('change_percentage', '0')

                trending.append({
                    "ticker": stock['ticker'],
                    "price": price,
                    "change": change_amount,
                    "changePercent": change_percentage,
                    "industry": overview_data.get('Industry', 'N/A'),
                    "sector": overview_data.get('Sector', 'N/A')
                })
            except Exception as e:
                logger.error(f"Error processing stock {stock.get('ticker', 'unknown')}: {str(e)}")
                continue

        if not trending:
            logger.error("No trending stocks were processed successfully")
            return jsonify({
                "status": "error",
                "error": "Failed to process any trending stocks"
            }), 500

        # Cache the data in database
        try:
            with engine.begin() as conn:
                # Delete old data
                conn.execute(text("DELETE FROM market_trends WHERE DATE(last_updated) < CURDATE()"))
                # Insert new data
                conn.execute(
                    text("INSERT INTO market_trends (trending_data, last_updated) VALUES (:data, NOW())"),
                    {"data": json.dumps(trending)}
                )
        except Exception as e:
            logger.error(f"Error caching market trends: {str(e)}")
            # Continue even if caching fails

        return jsonify({
            "status": "success",
            "data": trending
        })

    except Exception as e:
        logger.error(f"Error in get_trending_stocks: {str(e)}")
        logger.error(f"Full error details: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500


def init_market_trends_table():
    """Initialize the market_trends table if it doesn't exist"""
    try:
        with engine.connect() as conn:
            # Check if table exists
            result = conn.execute(text("""
                SELECT COUNT(*)
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
                AND table_name = 'market_trends'
            """)).scalar()
            
            if result == 0:
                logger.info("Creating market_trends table")
                conn.execute(text("""
                    CREATE TABLE market_trends (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        trending_data JSON,
                        last_updated DATETIME,
                        INDEX (last_updated)
                    )
                """))
                conn.commit()
                logger.info("market_trends table created successfully")
            else:
                logger.info("market_trends table already exists")
    except Exception as e:
        logger.error(f"Error initializing market_trends table: {str(e)}")
        logger.error(f"Full error details: {traceback.format_exc()}")

# Call this after engine initialization
init_market_trends_table()

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)