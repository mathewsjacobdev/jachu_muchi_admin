import { useEffect, useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import type { Order } from "@/types";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";
import { getOrders, updateOrderStatusApi } from "@/api/services/order.service";

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [detail, setDetail] = useState<Order | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        setOrders(await getOrders());
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const updateStatus = async (id: string, status: Order["status"]) => {
    const prev = orders.find((o) => o.id === id)?.status;
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await updateOrderStatusApi(id, status);
    } catch (e) {
      console.error(e);
      if (prev) {
        setOrders((list) => list.map((o) => (o.id === id ? { ...o, status: prev } : o)));
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description={isLoading ? "Loading…" : `${orders.length} total orders`} action={
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

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading orders…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-white/50">No orders found</div>
      ) : (
        <ResponsiveTable
          data={filtered}
          columns={[
            { key: "id", header: "Order ID", cellClassName: "text-sm font-medium text-white/90" },
            { key: "customer", header: "Customer", cellClassName: "text-sm text-white/85" },
            { key: "date", header: "Date", cellClassName: "text-sm text-white/55" },
            {
              key: "total",
              header: "Total",
              render: (o) => `₹${(o as Order).total.toLocaleString()}`,
              cellClassName: "text-right tabular-nums text-white/85",
            },
            {
              key: "status",
              header: "Status",
              render: (o) => (
                <Select
                  value={(o as Order).status}
                  onValueChange={(v) => void updateStatus((o as Order).id, v as Order["status"])}
                >
                  <SelectTrigger className="h-7 w-28 border-0 shadow-none p-0">
                    <StatusBadge status={(o as Order).status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              ),
              renderMobile: (o) => (
                <StatusBadge status={(o as Order).status} />
              ),
            },
          ]}
          renderActions={(o) => (
            <button
              type="button"
              onClick={() => setDetail(o)}
              className="rounded-lg p-2 text-blue-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
              aria-label={`View order ${o.id}`}
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
        />
      )}

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
