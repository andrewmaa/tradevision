import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowUpRight, Info, RefreshCw, BookmarkCheck, BookmarkPlus } from "lucide-react"
import React, { useRef } from "react"
import StockHeaderCard from "./StockHeaderCard"
import StockChart from "./StockChart"
import { API_BASE_URL } from '../app/api/stock-service'
import { motion, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"

// Get tooltip message based on score
const getTooltipMessage = (score: number) => {
  if (score >= 50) {
    return "This score indicates a strong positive sentiment with high market confidence, suggesting favorable conditions for investment.";
  }
  if (score >= 30) {
    return "This score shows moderate market sentiment with mixed signals, suggesting cautious consideration before investment.";
  }
  return "This score indicates concerning market sentiment with potential risks, suggesting careful evaluation before investment.";
};

// AnimatedProgress component
const AnimatedProgress = ({ value, className }: { value: number; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div ref={ref} className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-100 ${className}`}>
      <motion.div
        className="absolute left-0 top-0 h-full bg-primary"
        initial={{ width: 0 }}
        animate={isInView ? { width: `${value}%` } : { width: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
};

// ScoreBreakdown component
function ScoreBreakdown({ scores }: { scores: any }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const scoreItems = [
    {
      name: "Financial Momentum",
      value: scores.financial_momentum,
      description: "Measures recent price and volume trends relative to historical performance"
    },
    {
      name: "News Sentiment",
      value: scores.news_sentiment,
      description: "Overall sentiment from news articles and financial reports"
    },
    {
      name: "Social Buzz",
      value: scores.social_buzz,
      description: "Social media engagement and sentiment analysis"
    },
    {
      name: "Sentiment-Price Divergence",
      value: scores.sentiment_price_divergence,
      description: "Difference between market sentiment and price movement"
    },
    {
      name: "Hype Index",
      value: scores.hype_index,
      description: "Combined score of all metrics weighted by importance"
    }
  ];

  return (
    <Card className="w-full" ref={ref}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Score Breakdown
          <HoverCard openDelay={0} closeDelay={0}>
            <HoverCardTrigger>
              <Info className="h-4 w-4 text-gray-400" />
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <p className="text-sm">
                Each score is calculated on a scale of 0-100, with higher values indicating stronger positive signals.
                The Hype Index combines all metrics to give an overall assessment.
              </p>
            </HoverCardContent>
          </HoverCard>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {scoreItems.map((item, index) => (
          <motion.div
            key={item.name}
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.name}</span>
                <HoverCard openDelay={0} closeDelay={0}>
                  <HoverCardTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">{item.description}</p>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <motion.span 
                className="text-sm font-medium"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
              >
                {item.value.toFixed(1)}
              </motion.span>
            </div>
            <AnimatedProgress value={item.value} />
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

// ScoreCircle component
function ScoreCircle({ score }: { score: number }) {
  const radius = 36;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const target = Math.max(0, Math.min(score, 100));

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 50) return "#22c55e"; // green
    if (score >= 30) return "#eab308"; // yellow
    return "#ef4444"; // red
  };

  // Animation state
  const [animatedScore, setAnimatedScore] = React.useState(0);

  React.useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 900; // ms
    const initial = animatedScore;
    const diff = target - initial;

    function animate(ts: number) {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      setAnimatedScore(initial + diff * progress);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setAnimatedScore(target);
      }
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line
  }, [target]);

  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;
  const scoreColor = getScoreColor(animatedScore);

  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <div className="cursor-help group">
          <svg 
            height={radius * 2 + 4} 
            width={radius * 2 + 4} 
            viewBox={`0 0 ${radius * 2 + 4} ${radius * 2 + 4}`}
            className="translate-x-[-2px] translate-y-[-2px]"
          >
            <circle
              stroke="#e5e7eb"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius + 2}
              cy={radius + 2}
              className="transition-all duration-200 group-hover:stroke-[10px]"
            />
            <circle
              stroke={scoreColor}
              fill="transparent"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference + ' ' + circumference}
              style={{ 
                strokeDashoffset, 
                transition: 'stroke-dashoffset 0.5s, stroke 0.5s, stroke-width 0.2s',
                transform: 'rotate(-90deg)',
                transformOrigin: 'center'
              }}
              r={normalizedRadius}
              cx={radius + 2}
              cy={radius + 2}
              className="transition-all duration-200 group-hover:stroke-[10px]"
            />
            <text
              x={radius + 2}
              y={radius + 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="1.5rem"
              fontWeight="bold"
              fill="hsl(var(--foreground))"
            >
              {Math.round(animatedScore)}
            </text>
          </svg>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Hype Index Score: {Math.round(animatedScore)}</h4>
          <p className="text-sm text-muted-foreground">
            {getTooltipMessage(animatedScore)}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

interface MetricsCardProps {
  title: string
  value: string
  companyName: string
  change: {
    value: string
    percentage: string
    isPositive: boolean
  }
  chart?: React.ReactNode
}

export function MetricsCard({ title, value, companyName, change, chart }: MetricsCardProps) {
  const score = Number(value);
  const [showDetails, setShowDetails] = React.useState(false);
  const [stockData, setStockData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);

  const fetchStockDetails = async () => {
    setLoading(true);
    try {
      console.log("Fetching details for:", title);
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "text/event-stream"
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({ 
          symbol: title,
          force_refresh: false 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log(`Stream complete for ${title}`);
            // Process any remaining data in the buffer
            if (buffer.trim()) {
              const lines = buffer.split('\n\n');
              for (const line of lines) {
                if (line.trim()) {
                  console.log(`Processing final buffer for ${title}:`, line);
                  const [eventLine, dataLine] = line.split('\n');
                  if (dataLine) {
                    const data = JSON.parse(dataLine.replace('data: ', ''));
                    console.log(`Final data for ${title}:`, data);
                    if (data.step === 'complete' && data.status === 'success' && data.data) {
                      setStockData(data.data);
                    }
                  }
                }
              }
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              console.log(`Processing line for ${title}:`, line);
              const [eventLine, dataLine] = line.split('\n');
              if (dataLine) {
                const data = JSON.parse(dataLine.replace('data: ', ''));
                console.log(`Received data for ${title}:`, data);
                if (data.step === 'complete' && data.status === 'success' && data.data) {
                  console.log(`Updating stock data for ${title}`);
                  setStockData(data.data);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error reading stream for ${title}:`, error);
        throw error;
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error(`Error fetching data for ${title}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    setShowDetails(true);
    fetchStockDetails();
  };

  const handleRefreshClick = () => {
    fetchStockDetails();
  };

  const toggleSaveStock = () => {
    setIsSaved(!isSaved);
  };

  return (
    <>
      <Card 
        className="p-4 bg-background/50 backdrop-blur hover:bg-background/70 transition-colors cursor-pointer" 
        onClick={handleClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm text-muted-foreground">{title}</h3>
            <p className="text-sm font-medium">{companyName}</p>
            {change && (
              <div className="mt-1 flex items-center gap-2">
                <p className="text-lg font-bold">${change.value}</p>
                <p className={`text-md ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {change.isPositive ? '+' : ''}{change.percentage}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ScoreCircle score={score} />
            {chart}
          </div>
        </div>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="w-[800px] h-[600px] fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold">{companyName}</DialogTitle>
          </DialogHeader>
          
          <div className="h-[calc(100%-5rem)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : stockData ? (
              <div className="space-y-6">
                <StockHeaderCard
                  ticker={title}
                  currentPrice={stockData.financial_data?.current_price}
                  change={stockData.financial_data?.price_change}
                  companyInfo={stockData.company_info}
                  hypeIndex={stockData.scores?.hype_index}
                  lastRun={stockData.last_run}
                  onRefresh={() => fetchStockDetails()}
                  isDashboard={true}
                />
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                Failed to load stock details. Please try again.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}