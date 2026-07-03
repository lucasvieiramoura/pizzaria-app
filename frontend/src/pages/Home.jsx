import { useQuery, gql } from '@apollo/client';

const LIST_PRODUCTS = gql`
    query ListProducts {
        listProducts { id name price stock_quantity ingredients}
    }
`;

export function Home({ addToCart }) {
    const {data, loading, error } = useQuery(LIST_PRODUCTS);

    if (loading) return <div className='text-white p-8'>Carregando cardápio</div>
    if (error) return <div className='text-red-500 p-8'>Erro: {error.message}</div>


    return (
        <div className='min-h-screen bg-gray-950 p-6 text-white'>
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-extrabold text-orange-500">Nosso Cardápio</h1>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.listProducts.map(product => (
                <div key={product.id} className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
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
                ))}
            </div>
        </div>
    )
}