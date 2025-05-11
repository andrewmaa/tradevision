// API service for interacting with the Flask backend

export interface StockSearchResult {
  symbol: string
  name: string
  exchange: string
}

export interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  marketCap: number
  volume: number
  high52Week: number
  low52Week: number
  description: string
  historicalData: {
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  }[]
}

// API base URL from environment variable
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  ? (process.env.NEXT_PUBLIC_API_URL.startsWith('http') 
      ? process.env.NEXT_PUBLIC_API_URL 
      : `https://${process.env.NEXT_PUBLIC_API_URL}`)
  : "http://localhost:5001";

console.log('API_BASE_URL:', API_BASE_URL); // Debug log

const fetchOptions = {
  credentials: 'include' as const,
  headers: {
    'Content-Type': 'application/json',
  },
};

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  try {
    console.log('Searching stocks with URL:', `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`); // Debug log
    const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, fetchOptions)
    if (!response.ok) {
      throw new Error("Failed to search stocks")
    }
    const data = await response.json()
    return data.results
  } catch (error) {
    console.error("Error searching stocks:", error)
    return []
  }
}

export async function getStockData(symbol: string): Promise<StockData | null> {
  try {
    console.log('Getting stock data with URL:', `${API_BASE_URL}/stock/${encodeURIComponent(symbol)}`); // Debug log
    const response = await fetch(`${API_BASE_URL}/stock/${encodeURIComponent(symbol)}`, fetchOptions)
    if (!response.ok) {
      throw new Error(`Failed to get data for ${symbol}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Error getting stock data for ${symbol}:`, error)
    return null
  }
}

export async function getMultipleStocks(symbols: string[]): Promise<StockData[]> {
  try {
    const symbolsParam = symbols.join(",")
    console.log('Getting multiple stocks with URL:', `${API_BASE_URL}/stocks?symbols=${encodeURIComponent(symbolsParam)}`); // Debug log
    const response = await fetch(`${API_BASE_URL}/stocks?symbols=${encodeURIComponent(symbolsParam)}`, fetchOptions)
    if (!response.ok) {
      throw new Error("Failed to get multiple stocks")
    }
    const data = await response.json()
    return data.stocks
  } catch (error) {
    console.error("Error getting multiple stocks:", error)
    return []
  }
}
