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
import { AdminOrders } from './pages/AdminOrders';
import { AuthGuard } from './components/AuthGuard';;
import { CustomerOrders } from './pages/CustomerOrders';

import { gql } from '@apollo/client/core';
import { useQuery } from '@apollo/client/react';


const GET_ME = gql`
    query GetMe { 
    me {
        name 
        email 
        role 
        address {
          cep 
          street 
          number 
          }
      }
    }
`;

export default function App() {
  const [cart, setCart] = useState([]);
  const hasToken = !!localStorage.getItem('@PizzaToken');
  const { data } = useQuery(GET_ME);

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
   {!hasToken ? (
        <nav className="bg-gray-900/90 backdrop-blur-md border-b border-gray-800 p-4 sticky top-0 z-50 flex justify-between items-center text-sm font-semibold">
          <div className="flex gap-6 items-center">
            <Link to="/home" className="text-xl font-extrabold text-orange-500 tracking-wide">
                🍕 Pizzaria
              </Link>
              <Link to="/home" className="text-gray-300 hover:text-orange-500 transition-colors">
                Cardápio
              </Link>
            </div>
            <Link to="/login" className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl transition-colors">
              👤 Entrar
            </Link>
        </nav>
      ) : (
        <nav className="bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-6 py-4 sticky top-0 z-50 flex justify-between items-center text-sm font-semibold">
          <div className="flex gap-6 items-center">
            <Link to="/home" className="text-xl font-extrabold text-orange-500 tracking-wide mr-2">
              🍕 Pizzaria
            </Link>
            <Link to="/home" className="text-gray-300 hover:text-orange-500 transition-colors">
              Cardápio
            </Link>
            <Link to="/meus-pedidos" className="text-gray-300 hover:text-orange-500 transition-colors">
              Meus Pedidos
            </Link>
            {data?.me?.role === 'ADMIN' && (
              <Link to="/admin/products" className="text-orange-400 hover:text-orange-300 transition-colors bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20">
                🛠️ Painel Estoque
              </Link>
            )}
          </div>

          <div className="flex gap-4 items-center">
          <Link to="/cart" className="relative bg-gray-800 hover:bg-gray-700 text-white px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2">
            <span>🛒 Carrinho</span>
            {cart.length > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </span>
            )}
          </Link>

          <Link to="/profile" className="text-gray-300 hover:text-white transition-colors border-l border-gray-800 pl-4">
            👤 {data?.me?.name || "Minha Conta"}
          </Link>

          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }} 
            className="text-red-400 hover:text-red-300 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-xl transition-colors"
            >
              Sair
            </button>
          </div>
        </nav>
      )}

      <Routes>
        {/** Rotas públicas */}        
        <Route path="*" element={<Navigate to={hasToken ? "/home" : "/login"} />} />        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />        
        <Route path="/home" element={<Home addToCart={addToCart} />} />
        
        <Route path="/meus-pedidos" element={<CustomerOrders />} />
        <Route path="/cart" element={<Cart cartItems={cart} clearCart={clearCart} userAddress={data?.me?.address}/>} />
        <Route path="/status/:id" element={<OrderStatus />} />
        <Route path="/profile" element={<Profile />} />
      
        {/** Rotas protegidas pelo */}
        <Route element={<AuthGuard />}>
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/pedidos" element={<AdminOrders />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}