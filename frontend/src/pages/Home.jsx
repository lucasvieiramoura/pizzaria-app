import { gql } from '@apollo/client/core';
import { useQuery } from '@apollo/client/react';
import { useState } from 'react';

const LIST_PRODUCTS = gql`
    query ListProducts($search: String) {
        listProducts(search: $search) { 
        id 
        name 
        price 
        stock_quantity 
        ingredients 
        foto_url
        }
    }
`;

const API_URL = import.meta.env.VITE_API_URL;

export function Home({ addToCart }) {
    
    const [searchTerm, setSearchTerm] = useState('');
    const {data, loading, error } = useQuery(LIST_PRODUCTS, {
        variables: { search: searchTerm},
    });


    if (loading) return <div className='text-white p-8'>Carregando cardápio</div>
    if (error) return <div className='text-red-500 p-8'>Erro: {error.message}</div>


    return (
        <div className='min-h-screen bg-gray-950 p-6 text-white'>
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-extrabold text-orange-500">Nosso Cardápio</h1>
                {/* 🔍 Input de busca integrado */}
                <div className="w-full md:w-80">
                    <input 
                        type="text" 
                        placeholder="Buscar pizza ou ingrediente..." 
                        autoFocus
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-500 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    />
                </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.listProducts.map(product => {
                    const imgSource = product.foto_url ? `${API_URL}${product.foto_url}` : 'https://placehold.co/400x300?text=Sem+Foto';      
                 
                return (
                    
                <div key={product.id} className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
                    {/* 📸 Espaço para a imagem do produto */}
                        <div className="w-full h-40 bg-gray-950 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
                            <img 
                                src={imgSource || '/uploads/default-pizza.png'} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://placehold.co/600x400?text=Sem+Foto';
                                }}
                            />
                        </div>
                    <div>
                    <h3 className="text-xl font-bold text-white mb-1">{product.name}</h3>
                    <p className="text-gray-400 text-sm mb-3">{product.ingredients.join(', ')}</p>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                    <span className="text-green-400 font-bold text-lg">R$ {product.price.toFixed(2)}</span>
                    {product.stock_quantity > 0 ? (
                        <button onClick={() => addToCart(product)} className="bg-orange-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-500">
                        Adicionar
                        </button>
                    ) : (
                        <span className="text-red-500 text-sm font-semibold">Esgotado</span>
                    )}
                    </div>
                </div>
                );
            }
                )}
            </div>
            {data.listProducts.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                    Nenhuma pizza encontrada para "{searchTerm}".
                </div>
            )}
        </div>
    )
}