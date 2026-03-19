import { useState } from "react";
import { MOCK_ORDERS } from "@/lib/mock-data";
import { Order } from "@/types";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye } from "lucide-react";

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [filter, setFilter] = useState<string>("all");
  const [detail, setDetail] = useState<Order | null>(null);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const updateStatus = (id: string, status: Order["status"]) => {
    setOrders(orders.map((o) => o.id === id ? { ...o, status } : o));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description={`${orders.length} total orders`} action={
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      } />

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1 text-white/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-white/5">
            <tr className="border-b text-left transition-colors duration-200 hover:bg-white/10">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/50">Order ID</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map((o) => (
              <tr key={o.id} className="transition-colors duration-200 hover:bg-white/10">
                <td className="px-4 py-4 font-medium text-white/90">{o.id}</td>
                <td className="px-4 py-4 text-white/85">{o.customer}</td>
                <td className="px-4 py-4 text-white/55">{o.date}</td>
                <td className="px-4 py-4 text-right tabular-nums text-white/85">₹{o.total.toLocaleString()}</td>
                <td className="px-4 py-4">
                  <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as Order["status"])}>
                    <SelectTrigger className="h-7 w-28 text-xs border-0 shadow-none p-0">
                      <StatusBadge status={o.status} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-4 text-right">
                  <button onClick={() => setDetail(o)} className="rounded-lg p-2 text-blue-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"><Eye className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-sm text-white/50">No orders found</div>}
      </div>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Order {detail?.id}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="font-medium text-white">{detail.customer}</p>
                <p className="text-white/55">{detail.email}</p>
              </div>
              <div>
                <p className="mb-2 font-medium text-white">Items</p>
                {detail.items.map((item, i) => (
                  <div key={i} className="flex justify-between py-1">
                    <span className="text-white/80">{item.productName} ×{item.quantity}</span>
                    <span className="tabular-nums text-white/85">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t border-white/10 pt-2 font-medium">
                  <span className="text-white">Total</span>
                  <span className="tabular-nums text-white">₹{detail.total.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/55">Status:</span>
                <StatusBadge status={detail.status} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
