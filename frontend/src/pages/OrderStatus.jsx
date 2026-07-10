import { useParams } from 'react-router-dom';
import { gql } from '@apollo/client/core';
import { useQuery } from '@apollo/client/react';

const TRACK_ORDER = gql`
    query Track($id: ID!) {
        trackOrder(id: $id) {                
            status
            total_price
            driver_location {
                lat
                long
            }
        }
    }
`;
 const translateStatus = (status) => {
        switch(status) {
            case 'PAID': return 'Pedido Recebido 💳';
            case 'PREPARING': return 'No Forno / Em Preparo 🍕';
            case 'DELIVERING': return 'Saiu para Entrega 🚀';
            case 'DELIVERED': return 'Entregue ✅';
            default: return status;
        }
    };

export function OrderStatus() {
    const { id } = useParams();
    const { data, loading} = useQuery(TRACK_ORDER, { variables: { id },  pollInterval: 5000});
  
    if (loading) return <div className='text-white p-8'>Sincronizando status...</div>;
   //if (data == null ) return <div className='text-white p-8'>Data Vazio!</div>;    
    //if (error) return <div className='text-red-500 p-8'>Erro: {error.message}</div>


    const order = data?.trackOrder;
    return (
        <div className='min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6'>
            <div  className='bg-gray-900 border border-gray-800 p-8 rounded-2xl w-full max-w-md text-center space-y-6'>
                <h2 className='text-xl font-bold text-gray-400'>Acompanhamento do Pedido</h2>
                <span className='text-xs bg-gray-800 px-4 py-1 rounded-fulol text-gray-500'>ID: {id}</span>

                <div className='py-4'>
                    <p className='text-sm text-gray-400 mb-1'>Status Atual:  {translateStatus(order.status)}</p>
                    <p className='text-sm text-gray-400 mb-1'>Total: R$ {order?.total_price.toFixed(2)}</p>
                </div>

                <div className='bg-gray-800 p-4 roudend-xl text-left text-sm text-gray-300'>
                    {order?.status === 'PAID' && <p>🍕 O pagamento foi confirmado. A cozinha está separando seus ingredientes!</p>}
                    {order?.status === 'PREPARING' && <p>🔥 Sua pizza está no forno neste exato momento!</p>}
                    {order?.status === 'READY' && <p>📦 Pedido pronto! Aguardando o entregador coletar na pizzaria.</p>}
                    {order?.status === 'DELIVERING' && (
                        <div>
                            <p className='text-green-400 font-bold'>🚴 Saiu para entrega!</p>
                            <p className='text-xs text-gray-400 mt-2'>Localização mockada do entregador: Lat {order?.driver_location?.lat} / Long {order?.driver_location?.long}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}