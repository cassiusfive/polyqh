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
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Order {
  id: string;
  market: string;
  type: "Buy" | "Sell";
  outcome: string;
  shares: number;
  price: number;
  total: number;
  placed: string;
}

interface OpenOrdersProps {
  orders: Order[];
  onCancel: (orderId: string) => void;
}

export function OpenOrders({ orders, onCancel }: OpenOrdersProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl mb-4">Open Orders</h2>
      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No open orders
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[250px]">Market</TableHead>
                <TableHead className="min-w-[80px]">Type</TableHead>
                <TableHead className="min-w-[80px]">Outcome</TableHead>
                <TableHead className="text-right min-w-[80px]">Shares</TableHead>
                <TableHead className="text-right min-w-[80px]">Price</TableHead>
                <TableHead className="text-right min-w-[80px]">Total</TableHead>
                <TableHead className="min-w-[80px]">Placed</TableHead>
                <TableHead className="text-right min-w-[80px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="min-w-[250px] max-w-[400px]">
                    {order.market}
                  </TableCell>
                  <TableCell className="min-w-[80px]">
                    <Badge
                      variant={order.type === "Buy" ? "default" : "secondary"}
                    >
                      {order.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="min-w-[80px]">{order.outcome}</TableCell>
                  <TableCell className="text-right min-w-[80px]">{order.shares}</TableCell>
                  <TableCell className="text-right min-w-[80px]">
                    ${order.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right min-w-[80px]">
                    ${order.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 min-w-[80px] whitespace-nowrap">
                    {order.placed}
                  </TableCell>
                  <TableCell className="text-right min-w-[80px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancel(order.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
