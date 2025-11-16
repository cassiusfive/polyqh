import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Position {
  outcome: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
}

interface Trade {
  timestamp: string;
  type: "Buy" | "Sell";
  outcome: string;
  shares: number;
  price: number;
  total: number;
  status: "Completed" | "Pending" | "Failed";
}

interface Order {
  id: string;
  type: "Buy" | "Sell";
  outcome: string;
  shares: number;
  price: number;
  total: number;
  placed: string;
}

interface OrderBookEntry {
  price: number;
  shares: number;
  myShares: number;
}

interface MarketCardProps {
  marketId: string;
  title: string;
  category: string;
  icon?: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  closes: string;
  priceChange24h: number;
  positions: Position[];
  trades: Trade[];
  orders: Order[];
  orderBook: {
    yes: { bids: OrderBookEntry[]; asks: OrderBookEntry[] };
    no: { bids: OrderBookEntry[]; asks: OrderBookEntry[] };
  };
}

export function MarketCard({
  title,
  category,
  icon,
  yesPrice,
  noPrice,
  volume,
  closes,
  priceChange24h,
  positions,
  trades,
  orders,
  orderBook,
}: MarketCardProps) {
  const isPositive = priceChange24h >= 0;

  return (
    <Card className="p-6">
      {/* Market Header */}
      <div className="space-y-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {icon && (
                <img
                  src={icon}
                  alt={title}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              )}
              <h3 className="text-xl font-semibold">{title}</h3>
            </div>
            <Badge variant="outline">{category}</Badge>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Closes {closes}</div>
            <div className="text-sm text-gray-500">
              Volume: ${volume.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-500 mb-1">Yes</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold">
                ${yesPrice.toFixed(2)}
              </span>
              <div
                className={`flex items-center text-xs ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(priceChange24h).toFixed(1)}%</span>
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">No</div>
            <div className="text-2xl font-semibold">${noPrice.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Accordion for Positions, Trades, Orders */}
      <Accordion type="multiple" className="w-full">
        {/* Positions */}
        {positions.length > 0 && (
          <AccordionItem value="positions">
            <AccordionTrigger>
              Open Positions ({positions.length})
            </AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Outcome</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Badge
                          variant={
                            position.outcome === "Yes" ? "default" : "secondary"
                          }
                        >
                          {position.outcome}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {position.shares}
                      </TableCell>
                      <TableCell className="text-right">
                        ${position.avgPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${position.currentPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${position.value.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={`text-right ${
                          position.pnl >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        <div>
                          {position.pnl >= 0 ? "+" : ""}$
                          {position.pnl.toFixed(2)}
                        </div>
                        <div className="text-xs">
                          ({position.pnl >= 0 ? "+" : ""}
                          {position.pnlPercent.toFixed(1)}%)
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Trade History */}
        {trades.length > 0 && (
          <AccordionItem value="trades">
            <AccordionTrigger>Trade History ({trades.length})</AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-sm text-gray-500">
                        {trade.timestamp}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            trade.type === "Buy" ? "default" : "secondary"
                          }
                        >
                          {trade.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{trade.outcome}</TableCell>
                      <TableCell className="text-right">
                        {trade.shares}
                      </TableCell>
                      <TableCell className="text-right">
                        ${trade.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${trade.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            trade.status === "Completed"
                              ? "default"
                              : trade.status === "Pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {trade.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Open Orders & Order Book */}
        <AccordionItem value="orders">
          <AccordionTrigger>
            Order Book & Open Orders ({orders.length} open)
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6">
              {/* Order Book */}
              <div className="grid grid-cols-2 gap-4">
                {/* Yes Order Book */}
                <div>
                  <h4 className="font-semibold mb-2">Yes</h4>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 grid grid-cols-[80px_1fr_80px] gap-2 px-2">
                      <span>Price</span>
                      <span className="text-center">Depth</span>
                      <span className="text-right">Shares</span>
                    </div>
                    {(() => {
                      // Sort and limit to top 5 levels
                      const topAsks = [...orderBook.yes.asks]
                        .sort((a, b) => a.price - b.price) // Low to high
                        .slice(0, 5)
                        .reverse(); // Reverse to show high to low
                      const topBids = [...orderBook.yes.bids]
                        .sort((a, b) => b.price - a.price) // High to low
                        .slice(0, 5);

                      const allEntries = [...topAsks, ...topBids];
                      const maxShares =
                        allEntries.length > 0
                          ? Math.max(...allEntries.map((e) => e.shares))
                          : 1;

                      return (
                        <>
                          {/* Asks (Sell orders) */}
                          <div className="space-y-1">
                            {topAsks.map((entry, idx) => {
                              const widthPercent =
                                (entry.shares / maxShares) * 100;
                              const myPercent =
                                (entry.myShares / entry.shares) * 100;
                              return (
                                <div
                                  key={`yes-ask-${idx}`}
                                  className="grid grid-cols-[80px_1fr_80px] gap-2 items-center px-2 py-1 text-sm"
                                >
                                  <span className="text-red-600 font-medium">
                                    ${entry.price.toFixed(2)}
                                  </span>
                                  <div className="relative h-6 bg-red-50 rounded overflow-hidden">
                                    <div
                                      className="absolute left-0 top-0 h-full bg-red-200"
                                      style={{ width: `${widthPercent}%` }}
                                    >
                                      {entry.myShares > 0 && (
                                        <div
                                          className="absolute left-0 top-0 h-full bg-red-400"
                                          style={{ width: `${myPercent}%` }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-right text-gray-700 font-medium">
                                    {Math.round(entry.shares).toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {/* Bids (Buy orders) */}
                          <div className="space-y-1">
                            {topBids.map((entry, idx) => {
                              const widthPercent =
                                (entry.shares / maxShares) * 100;
                              const myPercent =
                                (entry.myShares / entry.shares) * 100;
                              return (
                                <div
                                  key={`yes-bid-${idx}`}
                                  className="grid grid-cols-[80px_1fr_80px] gap-2 items-center px-2 py-1 text-sm"
                                >
                                  <span className="text-green-600 font-medium">
                                    ${entry.price.toFixed(2)}
                                  </span>
                                  <div className="relative h-6 bg-green-50 rounded overflow-hidden">
                                    <div
                                      className="absolute left-0 top-0 h-full bg-green-200"
                                      style={{ width: `${widthPercent}%` }}
                                    >
                                      {entry.myShares > 0 && (
                                        <div
                                          className="absolute left-0 top-0 h-full bg-green-500"
                                          style={{ width: `${myPercent}%` }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-right text-gray-700 font-medium">
                                    {Math.round(entry.shares).toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* No Order Book */}
                <div>
                  <h4 className="font-semibold mb-2">No</h4>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 grid grid-cols-[80px_1fr_80px] gap-2 px-2">
                      <span>Price</span>
                      <span className="text-center">Depth</span>
                      <span className="text-right">Shares</span>
                    </div>
                    {(() => {
                      const topAsks = [...orderBook.no.asks]
                        .sort((a, b) => a.price - b.price)
                        .slice(0, 5)
                        .reverse();
                      const topBids = [...orderBook.no.bids]
                        .sort((a, b) => b.price - a.price)
                        .slice(0, 5);

                      const allEntries = [...topAsks, ...topBids];
                      const maxShares =
                        allEntries.length > 0
                          ? Math.max(...allEntries.map((e) => e.shares))
                          : 1;

                      return (
                        <>
                          {/* Asks (Sell orders) */}
                          <div className="space-y-1">
                            {topAsks.map((entry, idx) => {
                              const widthPercent =
                                (entry.shares / maxShares) * 100;
                              const myPercent =
                                (entry.myShares / entry.shares) * 100;
                              return (
                                <div
                                  key={`no-ask-${idx}`}
                                  className="grid grid-cols-[80px_1fr_80px] gap-2 items-center px-2 py-1 text-sm"
                                >
                                  <span className="text-red-600 font-medium">
                                    ${entry.price.toFixed(2)}
                                  </span>
                                  <div className="relative h-6 bg-red-50 rounded overflow-hidden">
                                    <div
                                      className="absolute left-0 top-0 h-full bg-red-200"
                                      style={{ width: `${widthPercent}%` }}
                                    >
                                      {entry.myShares > 0 && (
                                        <div
                                          className="absolute left-0 top-0 h-full bg-red-400"
                                          style={{ width: `${myPercent}%` }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-right text-gray-700 font-medium">
                                    {Math.round(entry.shares).toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {/* Bids (Buy orders) */}
                          <div className="space-y-1">
                            {topBids.map((entry, idx) => {
                              const widthPercent =
                                (entry.shares / maxShares) * 100;
                              const myPercent =
                                (entry.myShares / entry.shares) * 100;
                              return (
                                <div
                                  key={`no-bid-${idx}`}
                                  className="grid grid-cols-[80px_1fr_80px] gap-2 items-center px-2 py-1 text-sm"
                                >
                                  <span className="text-green-600 font-medium">
                                    ${entry.price.toFixed(2)}
                                  </span>
                                  <div className="relative h-6 bg-green-50 rounded overflow-hidden">
                                    <div
                                      className="absolute left-0 top-0 h-full bg-green-200"
                                      style={{ width: `${widthPercent}%` }}
                                    >
                                      {entry.myShares > 0 && (
                                        <div
                                          className="absolute left-0 top-0 h-full bg-green-500"
                                          style={{ width: `${myPercent}%` }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-right text-gray-700 font-medium">
                                    {Math.round(entry.shares).toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Open Orders Table */}
              {orders.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Your Open Orders</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead className="text-right">Shares</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Placed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Badge
                              variant={
                                order.type === "Buy" ? "default" : "secondary"
                              }
                            >
                              {order.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{order.outcome}</TableCell>
                          <TableCell className="text-right">
                            {order.shares}
                          </TableCell>
                          <TableCell className="text-right">
                            ${order.price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            ${order.total.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-gray-500">
                            {order.placed}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
