import { gql } from '@apollo/client/core';
import { useQuery } from '@apollo/client/react';

const LIST_PRODUCTS = gql`
    query ListProducts{
        listProducts{
            id
            name
        }
    }
`;

const CUSTOMER_ORDERS = gql`
    query CustomerOrders {
        customerOrders {
            id
            total_price
            status
            created_at
            items {
                product_id
                quantity
            }
        }
    }
`;

export function CustomerOrders() {
    const { data: ordersData, loading: ordersLoading, error: ordersError } = useQuery(CUSTOMER_ORDERS, { pollInterval: 15000});
    const { data: productData, loading: productLoading } = useQuery(LIST_PRODUCTS);

    const productMap ={};
    if(productData?.listProducts) {
        productData.listProducts.forEach(p => {
            productMap[p.id] = p.name;
        });
    }

    const translateStatus = (status) => {
        switch(status) {
            case 'PAID': return 'Pedido Recebido 💳';
            case 'PREPARING': return 'No Forno / Em Preparo 🍕';
            case 'DELIVERING': return 'Saiu para Entrega 🚀';
            case 'DELIVERED': return 'Entregue ✅';
            default: return status;
        }
    };

    if(ordersLoading || productLoading ) return <div className="p-6 text-white text-center">Carregando seus pedidos...</div>;
    if(ordersError) return <div className='p-6 text-red-500 text-center'>Erro: {ordersError.message}</div>;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
            <header className="mb-8 border-b border-gray-800 pb-4">
                <h1 className="text-3xl font-bold text-orange-500">Meus Pedidos 📝</h1>
                <p className="text-sm text-gray-400">Acompanhe suas pizzas em tempo real</p>
            </header>

            {ordersData?.customerOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">Você ainda não fez nenhum pedido.</p>
                    <a href="/" className="text-orange-500 hover:underline text-sm mt-2 inline-block">Ir para o cardápio 🍕</a>
                </div>
            ) : (
                <div className="space-y-4">
                    {ordersData.customerOrders.map(order => (
                        <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            
                            {/* Esquerda: Info do Pedido e Itens */}
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-gray-500">#...{order.id.slice(-6)}</span>
                                    <span className="text-xs text-gray-400">
                                        {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : ''}
                                    </span>
                                </div>
                                
                                <div className="space-y-1">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="text-sm text-gray-300">
                                            <span className="font-semibold text-orange-400">{item.quantity} x </span> {productMap[item.product_id] || "Pizza"}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Direita: Status e Preço */}
                            <div className="flex justify-between items-center md:flex-col md:items-end md:justify-center gap-2 border-t border-gray-800 pt-3 md:border-none md:pt-0">
                                <div className="text-sm">
                                    Total: <span className="font-bold text-green-400">R$ {order.total_price.toFixed(2)}</span>
                                </div>
                                <div className={`text-xs px-3 py-1.5 rounded-full font-bold border ${
                                    order.status === 'ENTREGUE' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse'
                                }`}>
                                    {translateStatus(order.status)}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}