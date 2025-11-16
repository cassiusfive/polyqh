import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PortfolioSummaryProps {
  totalValue: number;
  change24h: number;
  buyingPower: number;
  totalPositions: number;
}

export function PortfolioSummary({
  totalValue,
  change24h,
  buyingPower,
  totalPositions,
}: PortfolioSummaryProps) {
  const isPositive = change24h >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-6">
        <div className="text-sm text-gray-500 mb-1">Total Portfolio Value</div>
        <div className="text-3xl mb-2">${totalValue.toLocaleString()}</div>
        <div
          className={`flex items-center gap-1 text-sm ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>
            {isPositive ? "+" : ""}
            {change24h.toFixed(2)}% (24h)
          </span>
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-sm text-gray-500 mb-1">Buying Power</div>
        <div className="text-3xl mb-2">${buyingPower.toLocaleString()}</div>
        <div className="text-sm text-gray-400">Available to trade</div>
      </Card>

      <Card className="p-6">
        <div className="text-sm text-gray-500 mb-1">Open Positions</div>
        <div className="text-3xl mb-2">{totalPositions}</div>
        <div className="text-sm text-gray-400">Active markets</div>
      </Card>

      <Card className="p-6">
        <div className="text-sm text-gray-500 mb-1">Total P&L</div>
        <div className="text-3xl mb-2">
          ${(totalValue * (change24h / 100)).toFixed(2)}
        </div>
        <div
          className={`text-sm ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {isPositive ? "Profit" : "Loss"}
        </div>
      </Card>
    </div>
  );
}
