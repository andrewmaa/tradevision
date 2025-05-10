'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/components/sidebar";
import { useRouter } from 'next/navigation';

interface TrendingStock {
  ticker: string;
  price: string;
  change: string;
  changePercent: string;
  industry: string;
  sector: string;
}

const formatText = (text: string) => {
  if (text === 'N/A') return 'Other';
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function MarketPage() {
  const router = useRouter();
  const [trendingStocks, setTrendingStocks] = useState<TrendingStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingStocks = async () => {
      try {
        const response = await fetch('/api/market/trending');
        if (!response.ok) {
          throw new Error('Failed to fetch trending stocks');
        }
        const responseData = await response.json();
        
        if (responseData.status === 'error') {
          throw new Error(responseData.error || 'Failed to fetch trending stocks');
        }
        
        setTrendingStocks(responseData.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingStocks();
  }, []);

  const handleStockClick = (ticker: string) => {
    router.push(`/analyze?ticker=${ticker}`);
  };

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-4">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <p className="text-red-600">Error: {error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Market Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : trendingStocks.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No trending stocks available
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Change %</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Sector</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trendingStocks.map((stock) => (
                    <TableRow 
                      key={stock.ticker}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleStockClick(stock.ticker)}
                    >
                      <TableCell className="font-medium">{stock.ticker}</TableCell>
                      <TableCell>${parseFloat(stock.price).toFixed(2)}</TableCell>
                      <TableCell className={parseFloat(stock.change) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {parseFloat(stock.change) >= 0 ? '+' : ''}{parseFloat(stock.change).toFixed(2)}
                      </TableCell>
                      <TableCell className={parseFloat(stock.changePercent) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {parseFloat(stock.changePercent) >= 0 ? '+' : ''}{parseFloat(stock.changePercent).toFixed(2)}%
                      </TableCell>
                      <TableCell>{formatText(stock.industry)}</TableCell>
                      <TableCell>{formatText(stock.sector)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
