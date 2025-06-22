import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/admin/AdminLayout';
import Home from './pages/Home';
import Katalog from './pages/Katalog';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PaymentSimulation from './pages/PaymentSimulation';
import Promo from './pages/Promo';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManagement from './pages/admin/ProductManagement';
import UserManagement from './pages/admin/UserManagement';
import TransactionManagement from './pages/admin/TransactionManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import PromotionManagement from './pages/admin/PromotionManagement';
import SubCategory from './pages/SubCategory';
import ProductDetail from './pages/ProductDetail';
import Analytics from './pages/admin/Analytics';
import Cart from './pages/Cart';
import MyReviews from './pages/MyReviews';
import Settings from './pages/admin/Settings';

// Import CMS components
import BannerManagement from './components/admin/BannerManagement';
import FAQManagement from './components/admin/FAQManagement';
import ContentEditor from './components/admin/ContentEditor';
import CMSManagement from './pages/admin/CMSManagement';
import ReviewManagement from './pages/admin/ReviewManagement';

// Import CSS files
import './styles/AdminSidebar.css';
import './styles/CMSManagement.css';

// Admin route protection
const AdminProtectedRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  return adminToken ? children : <Navigate to="/admin/login" />;
};

// Regular route protection
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Regular user routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="katalog" element={<Katalog />} />
            <Route path="product/:id" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="promo" element={<Promo />} />
            <Route path="subcategory/:categoryId" element={<SubCategory />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="payment-simulation" element={<ProtectedRoute><PaymentSimulation /></ProtectedRoute>} />
            <Route path="my-reviews" element={<ProtectedRoute><MyReviews /></ProtectedRoute>} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="transactions" element={<TransactionManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="promotions" element={<PromotionManagement />} />
            <Route path="reviews" element={<ReviewManagement />} />
            {/* CMS routes */}
            <Route path="content" element={<CMSManagement />} />
            <Route path="content/banners" element={<BannerManagement />} />
            <Route path="content/faqs" element={<FAQManagement />} />
            <Route path="content/editor" element={<ContentEditor />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
