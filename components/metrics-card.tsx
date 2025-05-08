import { Card } from "@/components/ui/card"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowUpRight } from "lucide-react"
import React from "react"
import StockHeaderCard from "./StockHeaderCard"
import StockChart from "./StockChart"
import { API_BASE_URL } from '../app/api/stock-service'

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
              dominantBaseline="middle"
              fontSize="1.5rem"
              fontWeight="bold"
              fill="#222"
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

export function MetricsCard({ title, value, companyName, change, chart }: MetricsCardProps) {
  const score = Number(value);
  const [showDetails, setShowDetails] = React.useState(false);
  const [stockData, setStockData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchStockDetails = async () => {
    setLoading(true);
    try {
      console.log("Fetching details for:", title);
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({ 
          symbols: title,
          force_refresh: false 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Received data:", data);
        const stockResult = data.results[title]?.result;
        
        if (stockResult?.last_run) {
          const lastRun = new Date(stockResult.last_run);
          const now = new Date();
          const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
          
          // If data is older than 1 hour, refresh it
          if (hoursSinceLastRun >= 1) {
            console.log("Data is older than 1 hour, refreshing...");
            const refreshResponse = await fetch(`${API_BASE_URL}/analyze`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              mode: 'cors',
              credentials: 'omit',
              body: JSON.stringify({ 
                symbols: title,
                force_refresh: true 
              }),
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              setStockData(refreshData.results[title]?.result);
            }
          } else {
            console.log("Using cached data, last updated:", lastRun);
            setStockData(stockResult);
          }
        } else {
          // If no last_run timestamp, treat as new data
          console.log("No last_run timestamp, treating as new data");
          const refreshResponse = await fetch(`${API_BASE_URL}/analyze`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            mode: 'cors',
            credentials: 'omit',
            body: JSON.stringify({ 
              symbols: title,
              force_refresh: true 
            }),
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            setStockData(refreshData.results[title]?.result);
          }
        }
      } else {
        console.error("Failed to fetch data:", response.status);
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

  return (
    <>
      <Card 
        className="p-4 bg-background/50 backdrop-blur cursor-pointer hover:bg-background/70 transition-colors" 
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Details</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : stockData && (
            <div className="space-y-8">
              <StockHeaderCard
                ticker={title}
                currentPrice={stockData.financial_data?.current_price ?? 0}
                change={stockData.financial_data?.price_change ?? 0}
                companyInfo={stockData.company_info ?? { name: companyName }}
                hypeIndex={stockData.scores?.hype_index}
                lastRun={stockData.last_run}
              />
              <StockChart 
                data={stockData}
                companyInfo={stockData.company_info}
                onRefresh={() => fetchStockDetails()}
                loading={loading}
                status={stockData.status}
                pipelineSteps={stockData.pipeline_steps}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
