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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`)
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
    const response = await fetch(`${API_BASE_URL}/stock/${encodeURIComponent(symbol)}`)
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
    const response = await fetch(`${API_BASE_URL}/stocks?symbols=${encodeURIComponent(symbolsParam)}`)
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
