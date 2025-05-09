import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ScoreCircle } from "@/components/ScoreCircle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@radix-ui/react-tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, BookmarkCheck } from "lucide-react";
import { useState, useEffect } from "react";

interface StockHeaderCardProps {
  ticker: string;
  currentPrice: number;
  change: number;
  companyInfo: {
    name: string;
    sector?: string;
    industry?: string;
    marketCap?: number;
    exchange?: string;
    ipo?: string;
    url?: string;
    description?: string;
  };
  hypeIndex?: number;
  lastRun?: string;
}

function formatMarketCap(marketCap?: number) {
  if (!marketCap) return "-";
  if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
  if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
  return `$${marketCap.toLocaleString()}`;
}

export default function StockHeaderCard({
  ticker,
  currentPrice,
  change,
  companyInfo,
  hypeIndex,
  lastRun
}: StockHeaderCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  // Check if stock is saved on mount
  useEffect(() => {
    const savedStocks = JSON.parse(localStorage.getItem('savedStocks') || '[]');
    setIsSaved(savedStocks.includes(ticker));
  }, [ticker]);

  const toggleSaveStock = () => {
    const savedStocks = JSON.parse(localStorage.getItem('savedStocks') || '[]');
    
    if (isSaved) {
      const newSavedStocks = savedStocks.filter((stock: string) => stock !== ticker);
      localStorage.setItem('savedStocks', JSON.stringify(newSavedStocks));
      setIsSaved(false);
    } else {
      savedStocks.push(ticker);
      localStorage.setItem('savedStocks', JSON.stringify(savedStocks));
      setIsSaved(true);
    }
  };

  const isPositive = change >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const changePrefix = isPositive ? '+' : '';

  // Format the last run timestamp
  const formatLastRun = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 px-2 ">
        <div className="flex items-center gap-4">
          <HoverCard openDelay={0} closeDelay={0}>
            <HoverCardTrigger asChild>
              <span className="text-4xl font-bold tracking-tight cursor-help">{ticker}</span>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 z-50">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Stock Ticker</h4>
                <p className="text-sm text-muted-foreground">
                  The unique symbol used to identify this stock on the market.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
          <p className="text-4xl font-bold tracking-tight cursor-help">–</p>
          <HoverCard openDelay={0} closeDelay={0}>
            <HoverCardTrigger asChild>
              <span className="text-4xl font-bold cursor-help">${currentPrice.toFixed(2)}</span>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Current Price</h4>
                <p className="text-sm text-muted-foreground">
                  The latest trading price of the stock.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>

          <HoverCard openDelay={0} closeDelay={0}>
            <HoverCardTrigger asChild>
              <span className={`text-lg ${changeColor} cursor-help`}>{changePrefix}{change.toFixed(2)}%</span>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Price Change</h4>
                <p className="text-sm text-muted-foreground">
                  The percentage change in stock price from the previous trading session.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleSaveStock}
          className="flex items-center gap-2"
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <BookmarkPlus className="h-4 w-4" />
              Save to Dashboard
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 p-6">
          <div className="flex-1 min-w-0">
            <div className="text-xl font-semibold mb-2">
              {companyInfo.name}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1 text-sm text-gray-700">
              <div>
                <span className="font-semibold">Sector</span><br />
                {companyInfo.sector || "-"}
              </div>
              <div>
                <span className="font-semibold">Market Cap</span><br />
                {formatMarketCap(companyInfo.marketCap)}
              </div>
              <div>
                <span className="font-semibold">IPO Date</span><br />
                {companyInfo.ipo || "-"}
              </div>
              <div>
                <span className="font-semibold">Industry</span><br />
                {companyInfo.industry || "-"}
              </div>
              <div>
                <span className="font-semibold">Exchange</span><br />
                {companyInfo.exchange || "-"}
              </div>
              <div>
                <span className="font-semibold">Website</span><br />
                {companyInfo.url ? (
                  <Link href={companyInfo.url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    {companyInfo.url}
                  </Link>
                ) : "-"}
              </div>
            </div>
            {companyInfo.description && (
              <div className="text-sm text-muted-foreground mt-4 line-clamp-3">
                {companyInfo.description}
              </div>
            )}
            {lastRun && (
              <div className="mt-4 text-sm text-muted-foreground">
                Last updated: {formatLastRun(lastRun)}. Data is updated hourly by request.
              </div>
            )}
          </div>
          <div className="flex flex-col items-center justify-start">
            <ScoreCircle score={hypeIndex ?? 0} />
            <div className="mt-2 text-sm text-muted-foreground text-center">Hype Index<br /><span className="text-xs">(combined score)</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 