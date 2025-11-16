"use client";

import { useState, useMemo, useEffect } from "react";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { MarketCard } from "@/components/MarketCard";
import Image from "next/image";
import { getTopMarkets, getWalletData, fetchOrderBook } from "@/actions/wallet";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [topMarkets, setTopMarkets] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderBooks, setOrderBooks] = useState<Record<string, any>>({});
  const [buyingPower, setBuyingPower] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [markets, walletData] = await Promise.all([
          getTopMarkets(),
          getWalletData(),
        ]);
        setTopMarkets(markets);
        setPositions(walletData.positions);
        setTrades(walletData.trades);
        setOrders(walletData.orders);
        setBuyingPower(walletData.buyingPower);

        // Get unique conditionIds from user's activity
        const userConditionIds = new Set([
          ...walletData.positions
            .map((p: any) => p.conditionId)
            .filter(Boolean),
          ...walletData.trades.map((t: any) => t.conditionId).filter(Boolean),
          ...walletData.orders.map((o: any) => o.conditionId).filter(Boolean),
        ]);

        // Find markets with user activity and fetch their order books
        const activeMarkets = markets.filter((m: any) =>
          userConditionIds.has(m.conditionId),
        );

        // Fetch order books for both YES and NO tokens of active markets
        const orderBookPromises = activeMarkets.map(async (market: any) => {
          if (market.tokens?.yes && market.tokens?.no) {
            try {
              const [yesBook, noBook] = await Promise.all([
                fetchOrderBook(market.tokens.yes),
                fetchOrderBook(market.tokens.no),
              ]);
              return {
                conditionId: market.conditionId,
                orderBook: { yes: yesBook, no: noBook },
              };
            } catch (err) {
              console.error(
                `Failed to fetch order book for ${market.conditionId}:`,
                err,
              );
              return { conditionId: market.conditionId, orderBook: null };
            }
          }
          return { conditionId: market.conditionId, orderBook: null };
        });

        const orderBookResults = await Promise.all(orderBookPromises);
        const orderBooksMap = orderBookResults.reduce(
          (acc: any, { conditionId, orderBook }) => {
            if (orderBook) acc[conditionId] = orderBook;
            return acc;
          },
          {},
        );

        setOrderBooks(orderBooksMap);
      } catch (err) {
        setError("Failed to fetch data. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCancelOrder = (orderId: string) => {
    setOrders(orders.filter((order) => order.id !== orderId));
  };

  const portfolioData = useMemo(() => {
    const positionsValue = positions.reduce((sum, pos) => sum + pos.value, 0);
    const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0);

    // Total value = positions value + buying power (cash)
    const totalValue = positionsValue + buyingPower;

    const change24h =
      positionsValue > 0 ? (totalPnl / (positionsValue - totalPnl)) * 100 : 0;

    return {
      totalValue,
      change24h,
      buyingPower,
      totalPositions: positions.length,
    };
  }, [positions, buyingPower]);

  // Match user data to top 100 markets by conditionId
  const marketData = useMemo(() => {
    if (topMarkets.length === 0) {
      return [];
    }

    // Get unique conditionIds from user's positions, trades, and orders
    const userConditionIds = new Set([
      ...positions.map((p) => p.conditionId).filter(Boolean),
      ...trades.map((t) => t.conditionId).filter(Boolean),
      ...orders.map((o) => o.conditionId).filter(Boolean),
    ]);

    // Filter to only markets where user has activity
    return topMarkets
      .filter((market) => userConditionIds.has(market.conditionId))
      .map((market) => {
        const marketPositions = positions.filter(
          (p) => p.conditionId === market.conditionId,
        );
        const marketTrades = trades.filter(
          (t) => t.conditionId === market.conditionId,
        );
        const marketOrders = orders.filter(
          (o) => o.conditionId === market.conditionId,
        );

        // Use real order book if available, otherwise use empty structure
        const orderBook = orderBooks[market.conditionId] || {
          yes: { asks: [], bids: [] },
          no: { asks: [], bids: [] },
        };

        return {
          id: market.id,
          title: market.title,
          category: market.category,
          icon: market.icon,
          yesPrice: market.yesPrice,
          noPrice: market.noPrice,
          volume: market.volume,
          closes: market.closes,
          priceChange24h: market.priceChange24h,
          positions: marketPositions,
          trades: marketTrades,
          orders: marketOrders,
          orderBook,
        };
      });
  }, [topMarkets, positions, trades, orders, orderBooks]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/3sigma-logo.png"
              alt="ThreeSigma"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <h1 className="text-3xl font-semibold">ThreeSigma</h1>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="w-full h-full flex items-center justify-center pt-72">
            <p className="text-gray-500">Loading portfolio data...</p>
          </div>
        ) : (
          <>
            {/* Portfolio Summary */}
            <PortfolioSummary {...portfolioData} />

            {/* Markets */}
            {marketData.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Markets</h2>
                {marketData.map((market) => (
                  <MarketCard
                    key={market.id}
                    marketId={market.id}
                    title={market.title}
                    category={market.category}
                    icon={market.icon}
                    yesPrice={market.yesPrice}
                    noPrice={market.noPrice}
                    volume={market.volume}
                    closes={market.closes}
                    priceChange24h={market.priceChange24h}
                    positions={market.positions}
                    trades={market.trades}
                    orders={market.orders}
                    orderBook={market.orderBook}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border">
                <p className="text-gray-500">
                  No activity found in the top 100 markets.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
