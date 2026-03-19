import { Product, Category, Order, NewsItem, User, DashboardStats } from "@/types";

export const MOCK_STATS: DashboardStats = {
  totalProducts: 450,
  totalOrders: 1280,
  totalUsers: 3420,
  totalRevenue: 1284500,
};

export const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Air Flex Series", category: "Eyeglasses", price: 2499, stock: 120, image: "https://images.unsplash.com/photo-1574258495973-f7977a53ae5e?w=80&h=80&fit=crop", createdAt: "2024-01-15" },
  { id: "2", name: "Hustle Matte Black", category: "Sunglasses", price: 1899, stock: 85, image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=80&h=80&fit=crop", createdAt: "2024-01-12" },
  { id: "3", name: "Vincent Chase Aviator", category: "Sunglasses", price: 1499, stock: 200, image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=80&h=80&fit=crop", createdAt: "2024-01-10" },
  { id: "4", name: "Aqua Pro Lens", category: "Contact Lenses", price: 799, stock: 5, image: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=80&h=80&fit=crop", createdAt: "2024-01-08" },
  { id: "5", name: "Hooper Square", category: "Eyeglasses", price: 3299, stock: 45, image: "https://images.unsplash.com/photo-1574258495973-f7977a53ae5e?w=80&h=80&fit=crop", createdAt: "2024-01-05" },
  { id: "6", name: "Blu Block Screen", category: "Computer Glasses", price: 1299, stock: 300, image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=80&h=80&fit=crop", createdAt: "2024-01-03" },
  { id: "7", name: "Kids Fun Frame", category: "Kids", price: 999, stock: 8, image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=80&h=80&fit=crop", createdAt: "2024-01-01" },
  { id: "8", name: "Premium Titanium", category: "Eyeglasses", price: 5999, stock: 22, image: "https://images.unsplash.com/photo-1574258495973-f7977a53ae5e?w=80&h=80&fit=crop", createdAt: "2023-12-28" },
  { id: "9", name: "Night Drive HD", category: "Sunglasses", price: 2199, stock: 67, image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=80&h=80&fit=crop", createdAt: "2023-12-25" },
  { id: "10", name: "Ultra Slim Rimless", category: "Eyeglasses", price: 4499, stock: 3, image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=80&h=80&fit=crop", createdAt: "2023-12-20" },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Eyeglasses", productCount: 180 },
  { id: "2", name: "Sunglasses", productCount: 120 },
  { id: "3", name: "Contact Lenses", productCount: 60 },
  { id: "4", name: "Computer Glasses", productCount: 55 },
  { id: "5", name: "Kids", productCount: 35 },
];

export const MOCK_ORDERS: Order[] = [
  { id: "ORD-001", customer: "Rahul Sharma", email: "rahul@example.com", items: [{ productName: "Air Flex Series", quantity: 1, price: 2499 }], total: 2499, status: "delivered", date: "2024-01-15" },
  { id: "ORD-002", customer: "Priya Patel", email: "priya@example.com", items: [{ productName: "Hustle Matte Black", quantity: 2, price: 1899 }], total: 3798, status: "shipped", date: "2024-01-14" },
  { id: "ORD-003", customer: "Amit Kumar", email: "amit@example.com", items: [{ productName: "Vincent Chase Aviator", quantity: 1, price: 1499 }, { productName: "Blu Block Screen", quantity: 1, price: 1299 }], total: 2798, status: "pending", date: "2024-01-13" },
  { id: "ORD-004", customer: "Sneha Gupta", email: "sneha@example.com", items: [{ productName: "Premium Titanium", quantity: 1, price: 5999 }], total: 5999, status: "pending", date: "2024-01-12" },
  { id: "ORD-005", customer: "Vikram Singh", email: "vikram@example.com", items: [{ productName: "Aqua Pro Lens", quantity: 3, price: 799 }], total: 2397, status: "delivered", date: "2024-01-11" },
];

export const MOCK_NEWS: NewsItem[] = [
  { id: "1", title: "New Summer Collection Launch", description: "Introducing our vibrant summer collection with UV400 protection and lightweight frames.", image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=400&h=200&fit=crop", date: "2024-01-15", status: "Published" },
  { id: "2", title: "Blue Light Awareness Week", description: "Learn about the importance of blue light protection in our digital age.", image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop", date: "2024-01-10", status: "Draft" },
  { id: "3", title: "Store Expansion in Bangalore", description: "We are opening 5 new stores across Bangalore this quarter.", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop", date: "2024-01-05", status: "Published" },
];

export const MOCK_USERS: User[] = [
  { id: "1", name: "Rahul Sharma", email: "rahul@example.com", role: "Customer", joinedAt: "2023-06-15", avatar: "RS" },
  { id: "2", name: "Priya Patel", email: "priya@example.com", role: "Customer", joinedAt: "2023-07-20", avatar: "PP" },
  { id: "3", name: "Amit Kumar", email: "amit@example.com", role: "Customer", joinedAt: "2023-08-10", avatar: "AK" },
  { id: "4", name: "Sneha Gupta", email: "sneha@example.com", role: "VIP", joinedAt: "2023-03-01", avatar: "SG" },
  { id: "5", name: "Vikram Singh", email: "vikram@example.com", role: "Customer", joinedAt: "2023-09-22", avatar: "VS" },
  { id: "6", name: "Anita Desai", email: "anita@example.com", role: "VIP", joinedAt: "2023-04-15", avatar: "AD" },
];

export const RECENT_ACTIVITY = [
  { id: "1", action: "New order placed", detail: "ORD-003 by Amit Kumar", time: "2 min ago", type: "order" as const },
  { id: "2", action: "Product stock low", detail: "Ultra Slim Rimless (3 left)", time: "15 min ago", type: "warning" as const },
  { id: "3", action: "Order delivered", detail: "ORD-001 to Rahul Sharma", time: "1 hour ago", type: "success" as const },
  { id: "4", action: "New user registered", detail: "Meera Joshi", time: "2 hours ago", type: "user" as const },
  { id: "5", action: "Product added", detail: "Night Drive HD", time: "3 hours ago", type: "product" as const },
];
