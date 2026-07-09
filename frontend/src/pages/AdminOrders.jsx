import { gql } from '@apollo/client/core';
import { useQuery, useMutation } from '@apollo/client/react';

const LIST_ORDERS = gql`
    query ListOrders {
        listOrders {
            id
            total_price
            status
            items {
                product_id
                name
                quantity
            }
        }
    }
`;

const LIST_PRODUCTS = gql`
    query ListProducts {
        listProducts { id name price stock_quantity ingredients}
    }
`;

const UPDATE_ORDER_SATUS = gql`
    mutation UpdateOrderStatus($orderId: ID!, $status: OrderStatus!){
        updateOrderStatus(orderId: $orderId, status: $status)
    }
`;

export function AdminOrders() {
    const {data, loading, error, refetch } = useQuery(LIST_ORDERS, {
        pollInterval: 10000 // Atualiza a tela a cada 10 segundos
    });
    const { data: productsData}  = useQuery(LIST_PRODUCTS);
    const [updateStatus] = useMutation(UPDATE_ORDER_SATUS);

    const handleStatusChange = async (id, newStatus) =>{
        try {
            await updateStatus({
                variables: {orderId: id, status: newStatus}
            });
            refetch();
        } catch (err) {
            alert('Erro ao atualizar status: '+err)
        }
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 'PENDING' : return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'PREPARING': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'DELIVERING': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'DELIVERED': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const productMap = {};
    if(productsData?.listProducts){
        productsData.listProducts.forEach(p => {
            productMap[p.id] = p.name;
        });
    }

    if (loading) return <div className='p-6 text-white'>Carregando painel de pedidos...</div>
    if (error) return <div className='p-6 text-red-500'>Erro: {error.message}</div>

    return (
        <div className='min-h-screen bg-gray-950 text-white p-6'>
            <header className='flex justify-between items-center mb-6 border-b border-gray-800 pb-4'>
                <div>
                    <h1 className='text-2xl font-bold text-orange-500'>Painel de Pedidos 🍕 </h1>
                    <p className='text-xs text-gray-400'>Monitor da Cozinha e Entregas (Atualzia automaticamente)</p>
                </div>
                <button onClick={() => refetch()} className='bg-gray-800 hover:bg-gray-700 text-xs px-4 py-2 rounded-xl font-semibold'>
                    Forçar Atualização
                </button>
            </header>

            <div className='gird gird-cols-1 md:grid-cols-2 lg:gird-cols-3 gap-6'>
                {data?.listOrders.map(order => (
                    <div key={order.id} className='bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col justify-beteween space-y-4'>
                        <div>
                            <div className='flex justify-between items-start mb-2'>
                                <span className='text-xs text-gray-500 font-mono'> ID: #{order.id.slice(-6)}  </span>
                                <span className={`text-xs px-2 py-1 rounded-md border font-bold ${getStatusStyle(order.status)}`}>
                                    Status: {order.status}
                                </span>
                            </div>
                            {/*Itens do Pedido */}                  
                            <div className='space-y-1 my-3 border-y border-gray-800 py-3'>
                                {order.items.map((item, idx) => {
                                    const productName = productMap[item.product_id] || "Pizza (Id)";
                                    return(
                                    <div key={idx} className='flex justify-between text-sm text-gray-300'>
                                        <span>{ productName}</span>
                                        <span className='font-bold text-orange-400'>  x  {item.quantity}</span>
                                    </div>
                                    );
                                })}
                            </div>

                            <div className='text-right text-sm'>
                                Total: <span className='text-green-400 font-bold'>R$ {order.total_price.toFixed(2)}</span>
                            </div>
                        </div>
                            {/* Controles de Status */}
                            <div className='gird gird-cols-2 gap-2 pt-2 border-t border-gray-800/50'>
                                <button onClick={() => handleStatusChange(order.id, 'PREPARING')} className='bg-orange-600 hover:bg-orange-700 text-xs font-bold py-2 rounded-xs transition'>
                                    Começar Preparo
                                </button>
                                <button onClick={() => handleStatusChange(order.id, 'DELIVERING')} className="bg-blue-600 hover:bg-blue-700 text-xs font-bold py-2 rounded-xl transition">
                                    Enviar p/ Entrega
                                </button>
                                <button onClick={() => handleStatusChange(order.id, 'DELIVERED')}className="bg-green-600 hover:bg-green-700 text-xs font-bold py-2 col-span-2 rounded-xl transition">
                                    Marcar como Entregue
                                </button>
                            </div>
                        </div>
                ))}
            </div>
        </div>
    );
}