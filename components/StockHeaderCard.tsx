import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ScoreCircle } from "@/components/ScoreCircle";
import { SettingsAwareTooltip } from "@/components/ui/settings-aware-tooltip";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, BookmarkCheck, RefreshCw, ArrowUpRight, Loader2 } from "lucide-react";
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
  onRefresh?: () => Promise<void>;
  isDashboard?: boolean;
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
  onRefresh,
  isDashboard
}: StockHeaderCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [showRefreshDialog, setShowRefreshDialog] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayData, setDisplayData] = useState({
    currentPrice,
    change,
    companyInfo,
    hypeIndex,
    lastRun
  });

  // Update display data when props change
  useEffect(() => {
    if (!isRefreshing) {
      setDisplayData({
        currentPrice,
        change,
        companyInfo,
        hypeIndex,
        lastRun
      });
    }
  }, [currentPrice, change, companyInfo, hypeIndex, lastRun, isRefreshing]);

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

  const handleConfirmRefresh = async () => {
    setShowRefreshDialog(false);
    setIsRefreshing(true);
    // Clear the display data when starting refresh
    setDisplayData({
      currentPrice: 0,
      change: 0,
      companyInfo: {
        name: "",
        sector: "",
        industry: "",
        marketCap: 0,
        exchange: "",
        ipo: "",
        url: "",
        description: ""
      },
      hypeIndex: 0,
      lastRun: ""
    });
    try {
      await onRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Dialog open={showRefreshDialog} onOpenChange={setShowRefreshDialog}>
        <DialogContent className="w-[400px]">
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
            <Button variant="default" onClick={handleConfirmRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                'Confirm Refresh'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-card/30 backdrop-blur-sm rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {isDashboard ? (
              <span className="text-2xl sm:text-4xl font-bold tracking-tight break-all text-foreground">{ticker}</span>
            ) : (
              <SettingsAwareTooltip content={
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Stock Ticker</h4>
                  <p className="text-sm text-muted-foreground">
                    The unique symbol used to identify this stock on the market.
                  </p>
                </div>
              }>
                <span className="text-2xl sm:text-4xl font-bold tracking-tight break-all text-foreground">{ticker}</span>
              </SettingsAwareTooltip>
            )}
            <p className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">–</p>
            {isDashboard ? (
              <span className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">${displayData.currentPrice.toFixed(2)}</span>
            ) : (
              <SettingsAwareTooltip content={
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Current Price</h4>
                  <p className="text-sm text-muted-foreground">
                    The latest trading price of the stock.
                  </p>
                </div>
              }>
                {isRefreshing ? (
                  <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <span className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">${displayData.currentPrice.toFixed(2)}</span>
                )}
              </SettingsAwareTooltip>
            )}

            {isDashboard ? (
              <span className={`text-base sm:text-lg ${changeColor}`}>{changePrefix}{displayData.change.toFixed(2)}%</span>
            ) : (
              <SettingsAwareTooltip content={
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Price Change</h4>
                  <p className="text-sm text-muted-foreground">
                    The percentage change in stock price from the previous trading session.
                  </p>
                </div>
              }>
                {isRefreshing ? (
                  <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  <span className={`text-base sm:text-lg ${changeColor}`}>{changePrefix}{displayData.change.toFixed(2)}%</span>
                )}
              </SettingsAwareTooltip>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              isDashboard ? (
                <Link href={`/analyze?ticker=${ticker}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    View Full Analysis
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshClick}
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </>
                  )}
                </Button>
              )
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
            <div className="text-lg sm:text-xl font-semibold mb-2 break-words text-foreground">
              {isRefreshing ? (
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              ) : (
                displayData.companyInfo.name
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 text-sm text-foreground">
              <div>
                <span className="font-semibold">Sector</span><br />
                {isRefreshing ? (
                  <div className="h-4 w-24 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  <span className="break-words text-muted-foreground">{displayData.companyInfo.sector || "-"}</span>
                )}
              </div>
              <div>
                <span className="font-semibold">Market Cap</span><br />
                {isRefreshing ? (
                  <div className="h-4 w-24 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  <span className="break-words text-muted-foreground">{formatMarketCap(displayData.companyInfo.marketCap)}</span>
                )}
              </div>
              <div>
                <span className="font-semibold">IPO Date</span><br />
                {isRefreshing ? (
                  <div className="h-4 w-24 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  <span className="break-words text-muted-foreground">{displayData.companyInfo.ipo || "-"}</span>
                )}
              </div>
              <div>
                <span className="font-semibold">Industry</span><br />
                {isRefreshing ? (
                  <div className="h-4 w-24 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  <span className="break-words text-muted-foreground">{displayData.companyInfo.industry || "-"}</span>
                )}
              </div>
              <div>
                <span className="font-semibold">Exchange</span><br />
                {isRefreshing ? (
                  <div className="h-4 w-24 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  <span className="break-words text-muted-foreground">{displayData.companyInfo.exchange || "-"}</span>
                )}
              </div>
              <div>
                <span className="font-semibold">Website</span><br />
                {isRefreshing ? (
                  <div className="h-4 w-24 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  displayData.companyInfo.url ? (
                    <Link href={displayData.companyInfo.url} className="text-primary hover:underline break-all" target="_blank" rel="noopener noreferrer">
                      {displayData.companyInfo.url}
                    </Link>
                  ) : <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>
            {displayData.companyInfo.description && (
              <div className="text-sm text-muted-foreground mt-4 break-words">
                {isRefreshing ? (
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </div>
                ) : (
                  <>
                    <div className={showFullDescription ? "" : "line-clamp-3"}>
                      {displayData.companyInfo.description}
                    </div>
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-primary hover:text-primary/80 mt-1 text-sm font-medium"
                    >
                      {showFullDescription ? "Show less" : "Show more"}
                    </button>
                  </>
                )}
              </div>
            )}
            {displayData.lastRun && (
              <div className="mt-4 text-sm text-muted-foreground break-words">
                <div className="flex items-center justify-between">
                  {isRefreshing ? (
                    <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                  ) : (
                    <span>Last updated: {formatLastRun(displayData.lastRun)}. Data is updated hourly by request.</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center justify-start mt-4 md:mt-0">
            {isRefreshing ? (
              <div className="h-24 w-24 bg-muted animate-pulse rounded-full" />
            ) : (
              <ScoreCircle score={displayData.hypeIndex ?? 0} />
            )}
            <div className="mt-2 text-sm text-muted-foreground text-center">Hype Index<br /><span className="text-xs">(combined score)</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 