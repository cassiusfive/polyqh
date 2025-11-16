import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Trade {
  id: string;
  timestamp: string;
  market: string;
  type: "Buy" | "Sell";
  outcome: string;
  shares: number;
  price: number;
  total: number;
  status: "Completed" | "Pending" | "Failed";
}

interface RecentTradesProps {
  trades: Trade[];
}

export function RecentTrades({ trades }: RecentTradesProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl mb-4">Recent Trades</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[80px]">Time</TableHead>
              <TableHead className="min-w-[250px]">Market</TableHead>
              <TableHead className="min-w-[80px]">Type</TableHead>
              <TableHead className="min-w-[80px]">Outcome</TableHead>
              <TableHead className="text-right min-w-[80px]">Shares</TableHead>
              <TableHead className="text-right min-w-[80px]">Price</TableHead>
              <TableHead className="text-right min-w-[80px]">Total</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell className="text-sm text-gray-500 min-w-[80px] whitespace-nowrap">
                  {trade.timestamp}
                </TableCell>
                <TableCell className="min-w-[250px] max-w-[400px]">{trade.market}</TableCell>
                <TableCell className="min-w-[80px]">
                  <Badge
                    variant={trade.type === "Buy" ? "default" : "secondary"}
                  >
                    {trade.type}
                  </Badge>
                </TableCell>
                <TableCell className="min-w-[80px]">{trade.outcome}</TableCell>
                <TableCell className="text-right min-w-[80px]">{trade.shares}</TableCell>
                <TableCell className="text-right min-w-[80px]">
                  ${trade.price.toFixed(2)}
                </TableCell>
                <TableCell className="text-right min-w-[80px]">
                  ${trade.total.toFixed(2)}
                </TableCell>
                <TableCell className="min-w-[100px]">
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
      </div>
    </Card>
  );
}
