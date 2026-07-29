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

const API_URL_FOTO =  
import.meta.env.MODE ===  'production' 
  ? 'https://pizzaria-app-k4j2.onrender.com/graphql'
  : 'http://localhost:4000' ;

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
                    product.foto_url?.replace('http://localhost:4000', 'https://pizzaria-app-k4j2.onrender.com')
                    const imgSource = product.foto_url ? `${API_URL_FOTO}${product.foto_url}` : 'https://placehold.co/400x300?text=Sem+Foto';      
                 
                return (

                    <div key={product.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-lg hover:shadow-2xl hover:-translate-y-1">
                        <div>
                            <div className="relative w-full h-44 bg-gray-950 rounded-xl mb-4 overflow-hidden flex items-center justify-center border border-gray-800/50">
                            <img 
                                src={imgSource ||  product.foto_url || '/uploads/default-pizza.png'} 
                               // src={imgSource ||
                               //     product.foto_url 
                                //    ? product.foto_url.replace('http://localhost:4000/graphql', 'https://pizzaria-app-k4j2.onrender.com')
                               //      : '/placeholder.jpg'
                               // }
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                                <span className="absolute top-2 right-2 bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-md border border-yellow-500/30 backdrop-blur-md">
                                Poucas unidades!
                                </span>
                            )}
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1 tracking-tight">{product.name}</h3>
                            <p className="text-gray-400 text-xs leading-relaxed mb-4 line-clamp-2">
                            {Array.isArray(product.ingredients) ? product.ingredients.join(', ') : product.ingredients}
                            </p>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-800/60 mt-auto">
                            <div>
                            <span className="text-xs text-gray-500 block">Preço</span>
                            <span className="text-lg font-extrabold text-green-400">R$ {product.price.toFixed(2)}</span>
                            </div>

                            {product.stock_quantity > 0 ? (
                            <button 
                                onClick={() => addToCart(product)} 
                                className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
                            >
                                + Adicionar
                            </button>
                            ) : (
                            <span className="text-red-400 bg-red-500/10 border border-red-500/20 text-xs font-bold px-3 py-1.5 rounded-xl">
                                Esgotado
                            </span>
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