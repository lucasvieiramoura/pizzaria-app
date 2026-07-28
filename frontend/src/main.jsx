import ReactDOM from 'react-dom/client';
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { ApolloProvider } from '@apollo/client/react';
import { setContext } from '@apollo/client/link/context';
import App from './App';
import React from 'react';
import { CartProvider } from './context/CartContext';
import './index.css'; 

//const API_URL = import.meta.env.VITE_API_URL || 'https://pizzaria-app-k4j2.onrender.com/graphql';
 // import.meta.env === "development"
 // ? "http://localhost:4000/graphql"
  //: "https://pizzaria-app-k4j2.onrender.com";

const httpLink = createHttpLink({
  uri: 'https://pizzaria-app-k4j2.onrender.com/graphql',
});

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
        <App/>
      </CartProvider>
    </ApolloProvider>
  </React.StrictMode>
);