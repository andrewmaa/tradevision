import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ScoreCircle } from "@/components/ScoreCircle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@radix-ui/react-tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, BookmarkCheck, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  onRefresh?: () => void;
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
  lastRun,
  onRefresh
}: StockHeaderCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [showRefreshDialog, setShowRefreshDialog] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

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

  const handleRefreshClick = () => {
    setShowRefreshDialog(true);
  };

  const handleConfirmRefresh = () => {
    setShowRefreshDialog(false);
    onRefresh?.();
  };

  return (
    <div className="space-y-4">
      <Dialog open={showRefreshDialog} onOpenChange={setShowRefreshDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Refresh Data</DialogTitle>
            <DialogDescription>
              This will force a refresh of all data for {ticker}. This action cannot be undone and may take a few moments to complete.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefreshDialog(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleConfirmRefresh}>
              Confirm Refresh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <HoverCard openDelay={0} closeDelay={0}>
              <HoverCardTrigger asChild>
                <span className="text-2xl sm:text-4xl font-bold tracking-tight cursor-help break-all">{ticker}</span>
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
            <p className="text-2xl sm:text-4xl font-bold tracking-tight cursor-help">–</p>
            <HoverCard openDelay={0} closeDelay={0}>
              <HoverCardTrigger asChild>
                <span className="text-2xl sm:text-4xl font-bold cursor-help break-all">${currentPrice.toFixed(2)}</span>
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
                <span className={`text-base sm:text-lg ${changeColor} cursor-help`}>{changePrefix}{change.toFixed(2)}%</span>
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

          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshClick}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            )}
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
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 p-4 sm:p-6">
          <div className="flex-1 min-w-0">
            <div className="text-lg sm:text-xl font-semibold mb-2 break-words">
              {companyInfo.name}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 text-sm text-gray-700">
              <div>
                <span className="font-semibold">Sector</span><br />
                <span className="break-words">{companyInfo.sector || "-"}</span>
              </div>
              <div>
                <span className="font-semibold">Market Cap</span><br />
                <span className="break-words">{formatMarketCap(companyInfo.marketCap)}</span>
              </div>
              <div>
                <span className="font-semibold">IPO Date</span><br />
                <span className="break-words">{companyInfo.ipo || "-"}</span>
              </div>
              <div>
                <span className="font-semibold">Industry</span><br />
                <span className="break-words">{companyInfo.industry || "-"}</span>
              </div>
              <div>
                <span className="font-semibold">Exchange</span><br />
                <span className="break-words">{companyInfo.exchange || "-"}</span>
              </div>
              <div>
                <span className="font-semibold">Website</span><br />
                {companyInfo.url ? (
                  <Link href={companyInfo.url} className="text-blue-600 hover:underline break-all" target="_blank" rel="noopener noreferrer">
                    {companyInfo.url}
                  </Link>
                ) : "-"}
              </div>
            </div>
            {companyInfo.description && (
              <div className="text-sm text-muted-foreground mt-4 break-words">
                <div className={showFullDescription ? "" : "line-clamp-3"}>
                  {companyInfo.description}
                </div>
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-blue-600 hover:text-blue-800 mt-1 text-sm font-medium"
                >
                  {showFullDescription ? "Show less" : "Show more"}
                </button>
              </div>
            )}
            {lastRun && (
              <div className="mt-4 text-sm text-muted-foreground break-words">
                <div className="flex items-center justify-between">
                  <span>Last updated: {formatLastRun(lastRun)}. Data is updated hourly by request.</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center justify-start mt-4 md:mt-0">
            <ScoreCircle score={hypeIndex ?? 0} />
            <div className="mt-2 text-sm text-muted-foreground text-center">Hype Index<br /><span className="text-xs">(combined score)</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 