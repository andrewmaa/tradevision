import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-for-tradevision'
    DEBUG = os.environ.get('FLASK_DEBUG') or True
    
    # Add other configuration variables as needed
    CACHE_TIMEOUT = 300  # 5 minutes in seconds
