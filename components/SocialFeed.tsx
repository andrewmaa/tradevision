import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SocialFeedProps {
  newsData: {
    articles: Array<{
      title: string;
      url: string;
      published_at: string;
      source: string;
      sentiment: {
        compound: number;
      };
    }>;
  };
  socialData: {
    posts: Array<{
      platform: string;
      title?: string;
      description?: string;
      text: string;
      created_at: string;
      username: string;
      url: string;
      subreddit?: string;
      sentiment_score: number;
      engagement: number;
    }>;
  };
}

export default function SocialFeed({ newsData, socialData }: SocialFeedProps) {
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "Unknown date";
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.05) return "text-green-500";
    if (score < -0.05) return "text-red-500";
    return "text-gray-500";
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.05) return <ArrowUpRight className="h-4 w-4" />;
    if (score < -0.05) return <ArrowDownRight className="h-4 w-4" />;
    return null;
  };

  // Ensure articles is an array
  const articles = Array.isArray(newsData?.articles) ? newsData.articles : [];
  // Ensure posts is an array
  const posts = Array.isArray(socialData?.posts) ? socialData.posts : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Social & News Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="news" className="w-full">
          <TabsList className="flex w-full">
            <TabsTrigger value="news" className="flex-1">News</TabsTrigger>
            <TabsTrigger value="reddit" className="flex-1">Reddit</TabsTrigger>
            <TabsTrigger value="bluesky" className="flex-1">Bluesky</TabsTrigger>
          </TabsList>
          
          <TabsContent value="news">
            {articles.length === 0 ? (
              <div className="p-4 bg-white/50 backdrop-blur-sm rounded-lg border text-center text-muted-foreground">
                No news articles available
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articles.map((article, index) => (
                  <div key={index} className="p-4 bg-white/50 backdrop-blur-sm rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-medium">{article.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{article.source}</span>
                          <span>•</span>
                          <span>{formatDate(article.published_at)}</span>
                          <span className={getSentimentColor(article.sentiment.compound)}>
                            {getSentimentIcon(article.sentiment.compound)}
                          </span>
                        </div>
                      </div>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reddit">
            {posts.length === 0 ? (
              <div className="p-4 bg-white/50 backdrop-blur-sm rounded-lg border text-center text-muted-foreground">
                No Reddit posts available
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts
                  .filter(post => post.platform === "Reddit")
                  .map((post, index) => (
                    <div key={index} className="p-4 bg-white/50 backdrop-blur-sm rounded-lg border">
                      <div className="flex flex-col h-full">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium flex-1">{post.title || post.text}</h3>
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 ml-2 flex-shrink-0"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                        {post.description && (
                          <p className="text-sm text-muted-foreground line-clamp-[3] whitespace-pre-line mb-2">{post.description.split('\n').slice(0, 3).join('\n')}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-auto">
                          <span>r/{post.subreddit}</span>
                          <span>•</span>
                          <span>u/{post.username}</span>
                          <span>•</span>
                          <span>{formatDate(post.created_at)}</span>
                          <span className={getSentimentColor(post.sentiment_score)}>
                            {getSentimentIcon(post.sentiment_score)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bluesky">
            {posts.length === 0 ? (
              <div className="p-4 bg-white/50 backdrop-blur-sm rounded-lg border text-center text-muted-foreground">
                No Bluesky posts available
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts
                  .filter(post => post.platform === "Bluesky")
                  .map((post, index) => (
                    <div key={index} className="p-4 bg-white/50 backdrop-blur-sm rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="font-medium">{post.text}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>@{post.username}</span>
                            <span>•</span>
                            <span>{formatDate(post.created_at)}</span>
                            <span className={getSentimentColor(post.sentiment_score)}>
                              {getSentimentIcon(post.sentiment_score)}
                            </span>
                          </div>
                        </div>
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 