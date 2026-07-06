// src/App.jsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { AdminProducts } from './pages/AdminProducts';
import { Cart } from './pages/Cart';
import { OrderStatus } from './pages/OrderStatus';
import { Profile } from './pages/Profile';

export default function App() {
  const [cart, setCart] = useState([]);
  const hasToken = !!localStorage.getItem('@PizzaToken');

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    alert(`${product.name} adicionado ao carrinho!`);
  };

  const clearCart = () => setCart([]);

  return (
    <BrowserRouter>
      {hasToken && (
        <nav className="bg-gray-900 border-b border-gray-800 p-4 flex gap-4 text-sm font-semibold text-gray-300">
          <Link to="/home" className="hover:text-orange-500">🍕 Cardápio</Link>
          <Link to="/cart" className="hover:text-orange-500">🛒 Carrinho ({cart.length})</Link>
          <Link to="/admin/products" className="hover:text-orange-500">🛠️ Painel Estoque</Link>
          <Link to="/profile" className="hover:text-orange-500">👤 Perfil</Link>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="ml-auto text-red-500">Sair</button>
        </nav>
      )}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home addToCart={addToCart} />} />
        <Route path="/cart" element={<Cart cartItems={cart} clearCart={clearCart} />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/status/:id" element={<OrderStatus />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to={hasToken ? "/home" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}