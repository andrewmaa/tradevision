import os
from dotenv import load_dotenv
load_dotenv()  # This will load variables from a .env file if present
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sqlalchemy import create_engine, text
from io import StringIO
from sqlalchemy import create_engine
from sqlalchemy import text
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import pymysql
import json
from datetime import date, datetime
import nltk
import tempfile
import logging
import sys
from curl_cffi import requests as curl_requests

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
        
        print("DEBUG: Fetching historical data")
        hist = company.history(period=period)
        print("DEBUG: Historical data:", hist)

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
            date_str = date.strftime('%Y-%m-%d')
            historical_data[date_str] = {
                'Open': float(row['Open']),
                'High': float(row['High']),
                'Low': float(row['Low']),
                'Close': float(row['Close']),
                'Volume': float(row['Volume'])
            }

        data = {
            "ticker": ticker_symbol,
            "current_price": float(latest['Close']),
            "opening_price": float(latest['Open']),
            "daily_high": float(latest['High']),
            "daily_low": float(latest['Low']),
            "price_change": float(((latest["Close"] - prev_day['Close']) / prev_day['Close']) * 100),
            "trading_volume": float(latest["Volume"]),
            "volatility": float(volatility),
            "historical_data": historical_data
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
            model="gpt-4",
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
    BLUESKY_API = "https://bsky.social/xrpc"
    identifier = "tradevision.bsky.social"
    password = "Bluesky!"

    try:
        auth_response = requests.post(
            f"{BLUESKY_API}/com.atproto.server.createSession",
            json={"identifier": identifier, "password": password},
        )
        auth_response.raise_for_status()
        access_token = auth_response.json()["accessJwt"]
    except Exception as e:
        print(f"Bluesky auth failed: {e}")
        return []

    headers = {"Authorization": f"Bearer {access_token}"}
    all_posts = []

    for query in search_queries:
        try:
            response = requests.get(
                f"{BLUESKY_API}/app.bsky.feed.searchPosts",
                headers=headers,
                params={"q": query, "limit": max_results},
            )
            response.raise_for_status()
            posts = response.json().get("posts", [])

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
            print(f"Bluesky search failed for '{query}': {e}")
            continue

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
                        "text": submission.title + " " + (submission.selftext if submission.selftext else ""),
                        "created_at": pd.to_datetime(submission.created_utc, unit='s'),
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
                                "text": submission.title + " " + (submission.selftext if submission.selftext else ""),
                                "created_at": pd.to_datetime(submission.created_utc, unit='s'),
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
            "posts": all_posts,
            "top_posts": sorted(all_posts, key=lambda x: x.get('engagement', 0), reverse=True)[:10],
            "total_posts": len(all_posts),
            "avg_sentiment": sum(post["sentiment_score"] for post in all_posts) / len(all_posts),
            "sentiment_distribution": {
                "positive": len([p for p in all_posts if p["sentiment_score"] > 0.05]) / len(all_posts),
                "neutral": len([p for p in all_posts if -0.05 <= p["sentiment_score"] <= 0.05]) / len(all_posts),
                "negative": len([p for p in all_posts if p["sentiment_score"] < -0.05]) / len(all_posts),
            }
        }

"""# Stock Recommendations

"""

import requests

API_KEY = "LBYM2R0I3R8S52UA"

def get_alpha_vantage_trending():
    url = f"https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey={API_KEY}"

    try:
        response = requests.get(url, timeout=10)
        data = response.json()


        trending = [
            f"{stock['ticker']} ({stock['price']})"
            for stock in data.get('top_gainers', [])
        ]
        return trending[:10]

    except Exception as e:
        print(f"Error with Alpha Vantage: {e}")
        return []


'''print("Top Gaining Stocks to Consider Adding to Your Portfolio:")
print(get_alpha_vantage_trending())'''

"""## Description of Companies"""

import yfinance as yf

def get_company_description_from_yf(ticker):
    stock = yf.Ticker(ticker, session=session)
    return stock.info.get('longName', 'No description available')

'''print(get_company_description_from_yf("AAPL"))'''

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
            items.append((new_key, v))
    return dict(items)

def run_pipeline(ticker, force_refresh=False):
    from datetime import datetime, timedelta, timezone
    from dateutil import parser
    import json

    """Run complete analysis pipeline and print results at each step"""
    pipeline_steps = []

    now_utc = datetime.now(timezone.utc)

    # Step 0: Check last run from `data` table
    pipeline_steps.append({"step": "Checking cache", "status": "running"})
    with engine.connect() as conn:
        # Check if pipeline_steps column exists and add it if it doesn't
        try:
            # Check if column exists
            result = conn.execute(text("""
                SELECT COUNT(*)
                FROM information_schema.columns 
                WHERE table_name = 'data' 
                AND column_name = 'pipeline_steps'
            """)).scalar()
            
            if result == 0:
                # Column doesn't exist, add it
                conn.execute(text("""
                    ALTER TABLE data 
                    ADD COLUMN pipeline_steps JSON
                """))
        except Exception as e:
            print(f"Error managing pipeline_steps column: {e}")

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
            if now_utc - last_run_time < timedelta(hours=24):
                recent_data = conn.execute(
                    text("SELECT * FROM data WHERE `company_info.ticker` = :ticker ORDER BY last_run DESC LIMIT 1"),
                    {"ticker": ticker}
                ).mappings().fetchone()

                if recent_data:
                    pipeline_steps[-1]["status"] = "completed"
                    pipeline_steps[-1]["message"] = "Using cached data"
                    # Convert RowMapping to dict and parse the historical_data
                    recent_data_dict = dict(recent_data)
                    
                    # Reconstruct nested structure
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
                    
                    # Parse JSON strings back into objects
                    if 'financial_data' in reconstructed_data and 'historical_data' in reconstructed_data['financial_data']:
                        try:
                            historical_data = json.loads(reconstructed_data['financial_data']['historical_data'])
                            reconstructed_data['financial_data']['historical_data'] = historical_data
                        except json.JSONDecodeError as e:
                            print(f"DEBUG: Error parsing historical_data: {e}")
                    
                    return reconstructed_data
                else:
                    pipeline_steps[-1]["status"] = "completed"
                    pipeline_steps[-1]["message"] = "No cached data found"
            else:
                pipeline_steps[-1]["status"] = "completed"
                pipeline_steps[-1]["message"] = "Cache expired"
        else:
            pipeline_steps[-1]["status"] = "completed"
            pipeline_steps[-1]["message"] = "Force refresh requested"

    # Step 1: Financial data
    pipeline_steps.append({"step": "Fetching company info", "status": "running"})
    company_info = get_company_info(ticker)
    
    # Check for error in company info
    if "error" in company_info:
        pipeline_steps[-1]["status"] = "error"
        pipeline_steps[-1]["message"] = company_info["error"]
        return {
            "company_info": company_info,
            "pipeline_steps": pipeline_steps,
            "error": company_info["error"]
        }

    pipeline_steps[-1]["status"] = "completed"
    pipeline_steps[-1]["message"] = f"Got data for {company_info['name']}"

    # Step 2: Get financial data
    pipeline_steps.append({"step": "Fetching financial data", "status": "running"})
    financial_data = get_financial_data(ticker, period="1mo")
    
    # Check for error in financial data
    if "error" in financial_data:
        pipeline_steps[-1]["status"] = "error"
        pipeline_steps[-1]["message"] = financial_data["error"]
        return {
            "company_info": company_info,
            "financial_data": financial_data,
            "pipeline_steps": pipeline_steps,
            "error": financial_data["error"]
        }
        
    pipeline_steps[-1]["status"] = "completed"
    pipeline_steps[-1]["message"] = "Got financial data"

    # Step 3: News data
    pipeline_steps.append({"step": "Analyzing news", "status": "running"})
    news_data = get_news_and_extract_keywords(company_info['name'], days=2)
    pipeline_steps[-1]["status"] = "completed"
    pipeline_steps[-1]["message"] = f"Found {len(news_data['articles'])} articles"

    # Step 4: Expand keywords with AI
    pipeline_steps.append({"step": "Expanding keywords", "status": "running"})
    top_keywords = [k[0] for k in news_data['top_keywords'][:10]]
    expanded_data = expand_keywords_and_generate_queries(company_info['name'], top_keywords, company_info.get('industry', 'N/A'))
    pipeline_steps[-1]["status"] = "completed"
    pipeline_steps[-1]["message"] = "Generated search queries"

    # Step 5: Scraping social media
    pipeline_steps.append({"step": "Analyzing social media", "status": "running"})
    social_data = scrape_social_media(company_info['name'], expanded_data['search_queries'])
    pipeline_steps[-1]["status"] = "completed"
    pipeline_steps[-1]["message"] = f"Analyzed {social_data['total_posts']} posts"

    # Step 6: Calculate metrics
    pipeline_steps.append({"step": "Calculating metrics", "status": "running"})
    scores = calculate_metrics(financial_data, news_data, social_data)
    pipeline_steps[-1]["status"] = "completed"
    pipeline_steps[-1]["message"] = "Calculated all scores"

    # Prepare the response structure
    res = {
        "company_info": company_info,
        "financial_data": financial_data,
        "news_data": news_data,
        "expanded_data": expanded_data,
        "social_data": social_data,
        "scores": scores,
        "last_run": now_utc.isoformat(),
        "pipeline_steps": pipeline_steps
    }

    try:
        flattened = flatten_nested_dict(res)
        df_flat = pd.DataFrame([flattened])

        with engine.begin() as conn:
            conn.execute(text("DELETE FROM data WHERE `company_info.ticker` = :ticker"), {"ticker": ticker})
            df_flat.to_sql("data", con=conn, if_exists="append", index=False)
            recent_data = conn.execute(
                text("SELECT * FROM data WHERE `company_info.ticker` = :ticker ORDER BY last_run DESC LIMIT 1"),
                {"ticker": ticker}
            ).mappings().fetchone()

            if recent_data:
                # Convert RowMapping to dict and parse the historical_data
                recent_data_dict = dict(recent_data)
                
                # Reconstruct nested structure
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
                
                # Parse JSON strings back into objects
                if 'financial_data' in reconstructed_data and 'historical_data' in reconstructed_data['financial_data']:
                    try:
                        historical_data = json.loads(reconstructed_data['financial_data']['historical_data'])
                        reconstructed_data['financial_data']['historical_data'] = historical_data
                    except json.JSONDecodeError as e:
                        print(f"DEBUG: Error parsing historical_data: {e}")
                
                return reconstructed_data
            else:
                raise ValueError(f"No recent data found in DB for {ticker}")
    except Exception as e:
        print(f"DEBUG: Error in data processing: {e}")
        print(f"DEBUG: Error type: {type(e)}")
        print(f"DEBUG: Error details: {str(e)}")
        raise

app = Flask(__name__)

# Configure CORS
CORS(app, 
     resources={r"/*": {
         "origins": ["https://tradevision-kappa.vercel.app", "http://localhost:3000"],
         "methods": ["GET", "POST", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "Accept"],
         "supports_credentials": False,
         "expose_headers": ["Content-Type", "Authorization"]
     }})

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

@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    if request.method == "OPTIONS":
        return make_response(jsonify({"status": "ok"}), 200)
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        symbols_string = data.get('symbols')
        force_refresh = data.get('force_refresh', False)

        if not symbols_string:
            return jsonify({"error": "No symbols provided"}), 400

        symbols = [s.strip().upper() for s in symbols_string.split(',')]
        output_results = {}

        for symbol in symbols:
            try:
                # Run pipeline and update steps
                raw_result = run_pipeline(symbol, force_refresh=force_refresh)
                
                # Check if there's an error in the result
                has_error = "error" in raw_result
                
                # Update the response with the final result
                output_results[symbol] = {
                    "result": raw_result,
                    "status": "error" if has_error else "completed",
                    "pipeline_steps": raw_result.get("pipeline_steps", [])
                }
                
            except Exception as e:
                print(f"Error processing symbol {symbol}: {str(e)}")
                output_results[symbol] = {
                    "error": str(e),
                    "status": "error",
                    "pipeline_steps": []
                }

        return jsonify({
            "message": "Pipeline completed.",
            "results": output_results
        })
    except Exception as e:
        print(f"Error in analyze endpoint: {str(e)}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "status": "error"
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)