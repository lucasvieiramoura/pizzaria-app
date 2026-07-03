import { useQuery, useMutation, gql } from "@apollo/client";

const GET_METRICS = gql`
    query GetDashboardMetrics {
        getDashboardMetrics {
            total_revenue
            total_orders
            low_stock_products {
                id
                name
                stock_quantity
            }
        }
    }
`;

const UPDATE_STATUS = gql`
    mutation UpdateOrderStatus($orderId: ID!, $status: OrderStatus!) {
        updateOrderStatus(orderId: $orderId, status: $status)
    }
`;

export function DashboardKanban() {
    const { loading, error, data, refetch } = useQuery(GET_METRICS, { pollInterval: 10000 });
    const [updateStatus] = useMutation(UPDATE_STATUS);

    if (loading) return <p className="text-white">Carregando métricas...</p>;
    if (error) return <p className="text-white">Erro ao carregar métricas: {error.message}</p>;

    const handleStatusChange = async (id, newStatus) => {
        await updateStatus({ variables: { orderId: id, status: newStatus } });
        refetch(); // Recarrega os dados após a atualização
    };

    return (
        <div className="p-6 bg-gray-900 text-white min-h-screen">
            <h2 className="text-2xl font-bold mb-4"d>Painal Financeiro & Operações</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded">Faturamento: R$ {data.getDashboardMetrics.total_revenue}</div>
                <div className="bg-gray-800 p-4 rounded">Pedidos Totais: {data.getDashboardMetrics.total_orders}</div>
            </div>
        
            <h3 className="text-xl font-semibold mb-2 text-orange-400">Alerta de Estoque Crítico</h3>
            <ul className="bg-gray-800 p-4 rounded"d>
                {data.getDashboardMetrics.low_stock_products.map((p,i) =>{
                    <li key={i} className="text-red-400"d>{p.name} - Restam apenas {p.stock_quantity} un.</li>
                })}
            </ul>
        </div>
    );
}
