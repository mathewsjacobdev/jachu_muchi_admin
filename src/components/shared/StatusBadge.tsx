interface StatusBadgeProps {
  status: "pending" | "shipped" | "delivered";
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const variants: Record<string, string> = {
    pending: "border border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
    shipped: "border border-blue-400/20 bg-blue-400/10 text-blue-300",
    delivered: "border border-green-400/20 bg-green-400/10 text-green-300",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 ${variants[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default StatusBadge;
