import { api } from "../client";
import type { Order } from "@/types";

export const ORDERS_LIST_PATH = "/todos";
/** JSONPlaceholder: customer lookup for todo.userId. Replace when real API embeds customer on order. */
export const ORDERS_CUSTOMERS_PATH = "/users";
export const orderDetailPath = (id: string) => `/todos/${id}`;

type JsonPlaceholderTodo = {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
};

type JsonPlaceholderUser = { id: number; name: string; email: string };

const isJpTodo = (x: unknown): x is JsonPlaceholderTodo =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as JsonPlaceholderTodo).id === "number" &&
  typeof (x as JsonPlaceholderTodo).title === "string" &&
  "completed" in x;

const isOrderRow = (x: unknown): x is Order =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as Order).id === "string" &&
  Array.isArray((x as Order).items);

const todoToStatus = (t: JsonPlaceholderTodo): Order["status"] => {
  if (t.completed) return "delivered";
  return t.id % 2 === 0 ? "shipped" : "pending";
};

const mapTodoToOrder = (t: JsonPlaceholderTodo, customerName: string, email: string): Order => {
  const price = 100 + (t.id % 50) * 50;
  const qty = 1 + (t.userId % 3);
  const total = price * qty;
  return {
    id: `ORD-${String(t.id).padStart(3, "0")}`,
    customer: customerName,
    email,
    items: [{ productName: t.title.slice(0, 80), quantity: qty, price }],
    total,
    status: todoToStatus(t),
    date: new Date(2026, 0, (t.id % 28) + 1).toISOString().split("T")[0],
  };
};

const rowToOrder = (raw: Record<string, unknown>): Order => ({
  id: String(raw.id),
  customer: String(raw.customer ?? ""),
  email: String(raw.email ?? ""),
  items: Array.isArray(raw.items)
    ? (raw.items as Order["items"])
    : [{ productName: "Item", quantity: 1, price: 0 }],
  total: typeof raw.total === "number" ? raw.total : 0,
  status:
    raw.status === "pending" || raw.status === "shipped" || raw.status === "delivered"
      ? raw.status
      : "pending",
  date: String(raw.date ?? ""),
});

export const getOrders = async (): Promise<Order[]> => {
  const [todosRes, usersRes] = await Promise.all([
    api.get<unknown>(`${ORDERS_LIST_PATH}?_limit=30`),
    api.get<unknown>(ORDERS_CUSTOMERS_PATH),
  ]);

  const todos = todosRes.data;
  const users = usersRes.data;

  const userMap = new Map<number, JsonPlaceholderUser>();
  if (Array.isArray(users)) {
    for (const u of users) {
      if (u && typeof u === "object" && "id" in u && "name" in u) {
        const ju = u as JsonPlaceholderUser;
        userMap.set(ju.id, ju);
      }
    }
  }

  if (!Array.isArray(todos) || todos.length === 0) return [];
  if (isOrderRow(todos[0])) return todos as Order[];
  if (isJpTodo(todos[0])) {
    return (todos as JsonPlaceholderTodo[]).map((t) => {
      const u = userMap.get(t.userId);
      return mapTodoToOrder(t, u?.name ?? `User ${t.userId}`, u?.email ?? "");
    });
  }
  return todos.map((item) => rowToOrder(item as Record<string, unknown>));
};

export const updateOrderStatusApi = async (id: string, status: Order["status"]): Promise<void> => {
  const digits = id.replace(/\D/g, "");
  const numeric = digits || id;
  await api.patch(orderDetailPath(numeric), {
    completed: status === "delivered",
    status,
  });
};
