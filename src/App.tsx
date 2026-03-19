import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import AdminLayout from "@/components/layout/AdminLayout";
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import ProductsPage from "@/pages/ProductsPage";
import CategoriesPage from "@/pages/CategoriesPage";
import OrdersPage from "@/pages/OrdersPage";
import UsersPage from "@/pages/UsersPage";
import NewsPage from "@/pages/NewsPage";
import EnquiriesPage from "@/pages/EnquiriesPage";
import EnquiryDetailPage from "@/pages/EnquiryDetailPage";
import BranchesPage from "@/pages/BranchesPage";
import GalleryPage from "@/pages/GalleryPage";
import TestimonialsPage from "@/pages/TestimonialsPage";
import AlumniPage from "@/pages/AlumniPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="news" element={<NewsPage />} />
              <Route path="enquiries" element={<EnquiriesPage />} />
              <Route path="enquiries/:id" element={<EnquiryDetailPage />} />
              <Route path="branches" element={<BranchesPage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="testimonials" element={<TestimonialsPage />} />
              <Route path="alumni" element={<AlumniPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
