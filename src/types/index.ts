export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  productCount: number;
}

export interface Order {
  id: string;
  customer: string;
  email: string;
  items: { productName: string; quantity: number; price: number }[];
  total: number;
  status: "pending" | "shipped" | "delivered";
  date: string;
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  image: string;
  date: string;
  status: "Published" | "Draft";
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  avatar: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
}
