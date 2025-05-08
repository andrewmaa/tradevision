import redis
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Redis client
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    db=0,
    decode_responses=True
)

def test_redis_connection():
    try:
        # Test basic connection
        redis_client.ping()
        print("✅ Redis connection successful!")
        
        # Test pub/sub
        pubsub = redis_client.pubsub()
        channel = "test_channel"
        pubsub.subscribe(channel)
        print(f"✅ Subscribed to {channel}")
        
        # Test publishing
        redis_client.publish(channel, "test message")
        print("✅ Published test message")
        
        # Test receiving message
        message = pubsub.get_message()
        if message and message['type'] == 'subscribe':
            print("✅ Received subscription confirmation")
        
        # Clean up
        pubsub.unsubscribe(channel)
        print("✅ Unsubscribed from test channel")
        
        return True
    except Exception as e:
        print(f"❌ Redis connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_redis_connection() 