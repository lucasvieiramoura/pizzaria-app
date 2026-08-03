import ReactDOM from 'react-dom/client';
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { ApolloProvider } from '@apollo/client/react';
import { setContext } from '@apollo/client/link/context';
import App from './App';
import React from 'react';
import { CartProvider } from './context/CartContext';

import {GoogleOAuthProvider} from '@react-oauth/google';

import './index.css'; 

const API_URL = 
import.meta.env.MODE ===  'production' 
  ? 'https://pizzaria-app-k4j2.onrender.com/graphql'
  : "http://localhost:4000/graphql";


const httpLink = createHttpLink({
  uri: API_URL,
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Middleware para anexar o token JWT automaticamente em todo requisição do GraphQL
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('@PizzaToken'); // Supondo que você armazene o token no localStorage
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <CartProvider>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <App/>
        </GoogleOAuthProvider>
      </CartProvider>
    </ApolloProvider>
  </React.StrictMode>
);