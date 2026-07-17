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
    {!hasToken && (
        <nav className="bg-gray-900 border-b border-gray-800 p-4 flex gap-4 text-sm font-semibold text-gray-300">
          <Link to="/home" className="hover:text-orange-500">🍕 Cardápio</Link>
          <Link to="/login" className="hover:text-orange-500">👤 Login</Link>
        </nav>
      )}
      {hasToken && (
        <nav className="bg-gray-900 border-b border-gray-800 p-4 flex gap-4 text-sm font-semibold text-gray-300">
          <Link to="/home" className="hover:text-orange-500">🍕 Cardápio</Link>
          <Link to="/cart" className="hover:text-orange-500">🛒 Carrinho ({cart.length})</Link>
          <Link to="/admin/products" className="hover:text-orange-500">🛠️ Painel Estoque</Link>
          {!data?.me.name && (
            <Link to="/login" className="hover:text-orange-500">{ data?.me.name ? "  Olá, "+data?.me.name: " 👤 Login"} </Link>
          )}
          {data?.me.name && (
          <Link to="/profile" className="hover:text-orange-500">{ data?.me.name ? "  Olá, "+data?.me.name: " 👤 Login"} </Link>
          )}
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="ml-auto text-red-500">Sair</button>
        </nav>
      )}

      <Routes>
        {/** Rotas públicas */}        
        <Route path="*" element={<Navigate to={hasToken ? "/home" : "/login"} />} />        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />        
        <Route path="/home" element={<Home addToCart={addToCart} />} />
        
        <Route path="/meus-pedidos" element={<CustomerOrders />} />
        <Route path="/cart" element={<Cart cartItems={cart} clearCart={clearCart} />} />
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