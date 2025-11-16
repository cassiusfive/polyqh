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

interface Position {
  id: string;
  market: string;
  outcome: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
}

interface PositionsTableProps {
  positions: Position[];
}

export function PositionsTable({ positions }: PositionsTableProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl mb-4">Open Positions</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[250px]">Market</TableHead>
              <TableHead className="min-w-[100px]">Outcome</TableHead>
              <TableHead className="text-right min-w-[80px]">Shares</TableHead>
              <TableHead className="text-right min-w-[100px]">Avg Price</TableHead>
              <TableHead className="text-right min-w-[120px]">Current Price</TableHead>
              <TableHead className="text-right min-w-[100px]">Value</TableHead>
              <TableHead className="text-right min-w-[100px]">P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((position) => (
              <TableRow key={position.id}>
                <TableCell className="min-w-[250px] max-w-[400px]">
                  {position.market}
                </TableCell>
                <TableCell className="min-w-[100px]">
                  <Badge
                    variant={
                      position.outcome === "Yes" ? "default" : "secondary"
                    }
                  >
                    {position.outcome}
                  </Badge>
                </TableCell>
                <TableCell className="text-right min-w-[80px]">{position.shares}</TableCell>
                <TableCell className="text-right min-w-[100px]">
                  ${position.avgPrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-right min-w-[120px]">
                  ${position.currentPrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-right min-w-[100px]">
                  ${position.value.toFixed(2)}
                </TableCell>
                <TableCell
                  className={`text-right min-w-[100px] ${
                    position.pnl >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <div>
                    {position.pnl >= 0 ? "+" : ""}${position.pnl.toFixed(2)}
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
      </div>
    </Card>
  );
}
