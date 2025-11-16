"use server";

import { ClobClient, AssetType } from "@polymarket/clob-client";
import { Wallet } from "@ethersproject/wallet";
import {
  getPositions,
  getTopMarkets as getTopMarketsLib,
  getOrderBook,
  type Trade,
  type Order,
} from "@/lib/polymarket";

const WALLET_ADDRESS = process.env.POLYMARKET_PROXY_ADDRESS!;
const PRIVATE_KEY = process.env.POLYMARKET_PRIVATE_KEY!;
const CLOB_HOST = "https://clob.polymarket.com";
const SIGNATURE_TYPE = 1;

let clobClientPromise: Promise<ClobClient> | null = null;

async function getClobClient(): Promise<ClobClient> {
  if (!clobClientPromise) {
    clobClientPromise = (async () => {
      const signer = new Wallet(PRIVATE_KEY);
      const client = new ClobClient(CLOB_HOST, 137, signer);
      const creds = await client.createOrDeriveApiKey();
      return new ClobClient(
        CLOB_HOST,
        137,
        signer,
        creds,
        SIGNATURE_TYPE,
        WALLET_ADDRESS,
      );
    })();
  }
  return clobClientPromise;
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function parseTimestamp(timestamp: any): Date {
  if (!timestamp) return new Date();

  if (typeof timestamp === "string" && !isNaN(Number(timestamp))) {
    return new Date(Number(timestamp) * 1000);
  }

  if (typeof timestamp === "number") {
    return new Date(timestamp * 1000);
  }

  return new Date(timestamp);
}

/**
 * Get trade history (requires authentication)
 */
async function getTrades(): Promise<Trade[]> {
  try {
    const clobClient = await getClobClient();
    const trades = await clobClient.getTrades(
      { maker_address: WALLET_ADDRESS },
      true,
    );

    if (!Array.isArray(trades)) return [];

    return trades
      .map((trade: any) => {
        const parsedTimestamp = parseTimestamp(trade.match_time);
        const timeAgo = getTimeAgo(parsedTimestamp);

        // if trader_side is MAKER, find the user's specific matched amount
        let shares = parseFloat(trade.size || "0");
        let price = parseFloat(trade.price || "0");
        let side = trade.side;

        if (
          trade.trader_side === "MAKER" &&
          Array.isArray(trade.maker_orders)
        ) {
          // find the maker order that belongs to this wallet
          const userOrder = trade.maker_orders.find(
            (order: any) =>
              order.maker_address?.toLowerCase() ===
              WALLET_ADDRESS.toLowerCase(),
          );

          if (userOrder) {
            shares = parseFloat(userOrder.matched_amount || "0");
            price = parseFloat(userOrder.price || trade.price || "0");
            side = userOrder.side;
          }
        }

        return {
          timestamp: timeAgo,
          market: trade.asset_id || "Unknown Market",
          conditionId: trade.market,
          type: (side === "BUY" ? "Buy" : "Sell") as "Buy" | "Sell",
          outcome: trade.outcome || "Yes",
          shares,
          price,
          total: shares * price,
          status: "Completed" as const,
        };
      })
      .slice(0, 20);
  } catch (error) {
    console.error("Error fetching trades:", error);
    return [];
  }
}

/**
 * Get open orders (requires authentication)
 */
async function getOpenOrders(): Promise<Order[]> {
  try {
    const clobClient = await getClobClient();
    const orders = await clobClient.getOpenOrders({}, true);

    if (!Array.isArray(orders)) return [];

    return orders.map((order: any) => ({
      id: order.order_id || order.id,
      market: order.asset_id || "Unknown Market",
      conditionId: order.market,
      type: (order.side === "BUY" ? "Buy" : "Sell") as "Buy" | "Sell",
      outcome: order.outcome || "Yes",
      shares: parseFloat(order.original_size || order.size || "0"),
      price: parseFloat(order.price || "0"),
      total:
        parseFloat(order.original_size || order.size || "0") *
        parseFloat(order.price || "0"),
      placed: getTimeAgo(parseTimestamp(order.created || order.created_at)),
    }));
  } catch (error) {
    console.error("Error fetching open orders:", error);
    return [];
  }
}

/**
 * Get buying power using CLOB client balance/allowance
 */
async function getBuyingPower(): Promise<number> {
  try {
    const clobClient = await getClobClient();
    const result = await clobClient.getBalanceAllowance({
      asset_type: AssetType.COLLATERAL,
    });

    // balance is in micro-USDC (6 decimals)
    const balanceRaw = parseFloat(result?.balance || "0");
    const balance = balanceRaw / 1_000_000;

    return balance;
  } catch (error) {
    console.error("Error fetching buying power:", error);
    return 0;
  }
}

/**
 * Server action: Fetch all wallet data
 */
export async function getWalletData() {
  const [positions, trades, orders, buyingPower] = await Promise.all([
    getPositions(WALLET_ADDRESS),
    getTrades(),
    getOpenOrders(),
    getBuyingPower(),
  ]);

  return { positions, trades, orders, buyingPower };
}

/**
 * Server action: Get top markets
 */
export async function getTopMarkets() {
  return await getTopMarketsLib();
}

/**
 * Server action: Fetch order book
 */
export async function fetchOrderBook(tokenId: string) {
  return await getOrderBook(tokenId);
}
