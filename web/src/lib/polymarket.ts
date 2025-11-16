export interface Position {
  market: string;
  marketId?: string;
  conditionId?: string;
  outcome: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
}

export interface Trade {
  timestamp: string;
  market: string;
  conditionId?: string;
  type: "Buy" | "Sell";
  outcome: string;
  shares: number;
  price: number;
  total: number;
  status: "Completed" | "Pending" | "Failed";
}

export interface Order {
  id: string;
  market: string;
  conditionId?: string;
  type: "Buy" | "Sell";
  outcome: string;
  shares: number;
  price: number;
  total: number;
  placed: string;
}

export interface Market {
  id: string;
  title: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  closes: string;
  priceChange24h: number;
}

/**
 * Get positions for a wallet address using Polymarket Data API
 */
export async function getPositions(walletAddress: string): Promise<Position[]> {
  try {
    const response = await fetch(
      `https://data-api.polymarket.com/positions?user=${walletAddress}&limit=100`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const positions = await response.json();

    if (!Array.isArray(positions)) {
      return [];
    }

    return positions.map((pos: any) => ({
      market: pos.title || "Unknown Market",
      conditionId: pos.condition_id,
      outcome: pos.outcome || "Yes",
      shares: parseFloat(pos.size || "0"),
      avgPrice: parseFloat(pos.avgPrice || "0"),
      currentPrice: parseFloat(pos.curPrice || "0"),
      value: parseFloat(pos.currentValue || "0"),
      pnl: parseFloat(pos.cashPnl || "0"),
      pnlPercent: parseFloat(pos.percentPnl || "0"),
    }));
  } catch (error) {
    console.error("Error fetching positions:", error);
    return [];
  }
}

// Trades and orders require authentication - moved to server actions

/**
 * Get order book for a market (public API, no auth required)
 */
export async function getOrderBook(tokenId: string) {
  try {
    const response = await fetch(
      `https://clob.polymarket.com/book?token_id=${tokenId}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const orderBook = await response.json();

    return {
      asks:
        orderBook.asks?.map((ask: any) => ({
          price: parseFloat(ask.price),
          shares: parseFloat(ask.size),
          myShares: 0, // Will be calculated based on user's orders
        })) || [],
      bids:
        orderBook.bids?.map((bid: any) => ({
          price: parseFloat(bid.price),
          shares: parseFloat(bid.size),
          myShares: 0, // Will be calculated based on user's orders
        })) || [],
    };
  } catch (error) {
    console.error("Error fetching order book:", error);
    return { asks: [], bids: [] };
  }
}

/**
 * Get top 100 markets from Gamma API
 */
export async function getTopMarkets() {
  try {
    const response = await fetch(
      `https://gamma-api.polymarket.com/markets?limit=1000&order=volume24hr&ascending=false&closed=false`,
    );

    if (!response.ok) {
      console.error(`Failed to fetch top markets: ${response.status}`);
      return [];
    }

    const markets = await response.json();

    if (!Array.isArray(markets)) {
      return [];
    }

    return markets.map((market: any) => {
      // Parse outcome prices (usually a JSON string)
      let yesPrice = 0.5;
      let noPrice = 0.5;
      try {
        if (market.outcomePrices) {
          const prices = JSON.parse(market.outcomePrices);
          if (Array.isArray(prices) && prices.length >= 2) {
            yesPrice = parseFloat(prices[0]) || 0.5;
            noPrice = parseFloat(prices[1]) || 0.5;
          }
        }
      } catch (e) {
        console.warn("Failed to parse outcome prices:", e);
      }

      // Calculate 24h price change
      const priceChange24h = market.oneDayPriceChange
        ? parseFloat(market.oneDayPriceChange) * 100
        : 0;

      // Parse tokens array to get YES and NO token IDs
      let tokens = { yes: "", no: "" };
      try {
        if (market.clobTokenIds) {
          const tokenArray = JSON.parse(market.clobTokenIds);
          if (Array.isArray(tokenArray) && tokenArray.length >= 2) {
            tokens = {
              yes: tokenArray[0] || "",
              no: tokenArray[1] || "",
            };
          }
        }
      } catch (e) {
        console.warn("Failed to parse tokens:", e);
      }

      return {
        id: market.id,
        slug: market.slug,
        conditionId: market.conditionId,
        title: market.question || "Unknown Market",
        category: market.category || "Other",
        yesPrice,
        noPrice,
        volume: parseFloat(market.volume || market.volumeNum || "0"),
        closes: market.endDateIso
          ? new Date(market.endDateIso).toLocaleDateString()
          : "TBD",
        priceChange24h,
        description: market.description,
        image: market.image,
        icon: market.icon,
        active: market.active,
        closed: market.closed,
        volume24hr: parseFloat(market.volume24hr || "0"),
        liquidity: parseFloat(market.liquidityNum || "0"),
        tokens,
      };
    });
  } catch (error) {
    console.error("Error fetching top markets:", error);
    return [];
  }
}
