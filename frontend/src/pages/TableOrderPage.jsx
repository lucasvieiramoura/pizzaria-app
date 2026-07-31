import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { useQuery } from '@apollo/client/react';
import { GET_TABLE_SESSION, ADD_ITEM_TO_TABLE, CLOSE_TABLE_SESSION } from '../../../backend/src/graphql/tableQueries';
import ReceiptModal from '../components/ReceiptModal';

export function TableOrderPage() {
  const { tableNumber } = useParams();
  const numMesa = parseInt(tableNumber);

  const [cart, setCart] = useState([]);
  const [receiptData, setReceiptData] = useState(null);

  // Busca dados em tempo real da mesa
  const { data, loading, refetch } = useQuery(GET_TABLE_SESSION, {
    variables: { table_number: numMesa },
    pollInterval: 5000 // Re-busca a cada 5 segundos para atualizar pedidos de outros clientes/garçons na mesma mesa
  });

  const [addItemToTable] = useMutation(ADD_ITEM_TO_TABLE);
  const [closeTable] = useMutation(CLOSE_TABLE_SESSION);

  const session = data?.getTableSession;

  // Enviar os itens selecionados para a cozinha/bar
  const handleSendOrder = async () => {
    if (cart.length === 0) return;

    try {
      const itemsInput = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }));

      await addItemToTable({
        variables: {
          table_number: numMesa,
          items: itemsInput
        }
      });

      setCart([]); // Limpa o carrinho temporário
      refetch(); // Atualiza os pedidos na tela
      alert('Pedido enviado para a cozinha com sucesso!');
    } catch (err) {
      alert(`Erro ao lançar pedido: ${err.message}`);
    }
  };

  // Solicitar o fechamento da conta da mesa
  const handleCloseSession = async () => {
    if (!window.confirm(`Deseja realmente fechar a conta da Mesa ${numMesa}?`)) return;

    try {
      const { data } = await closeTable({
        variables: { table_number: numMesa }
      });

      setReceiptData(data.closeTableSession); // Abre o Modal da Nota Fiscal
      refetch();
    } catch (err) {
      alert(`Erro ao fechar conta: ${err.message}`);
    }
  };

  if (loading) return <div className="p-8 text-center text-white">Carregando comanda da mesa...</div>;

  return (
    <div className="min-h-screen bg-[#131722] text-white p-4 max-w-4xl mx-auto">
      {/* Header com destaque do Número da Mesa */}
      <div className="flex justify-between items-center bg-[#1f2937] p-4 rounded-xl border border-gray-700 mb-6">
        <div>
          <span className="text-xs uppercase text-amber-500 font-bold tracking-wider">Atendimento Local</span>
          <h1 className="text-2xl font-black">Mesa {numMesa}</h1>
        </div>
        <button
          onClick={handleCloseSession}
          disabled={!session || session.subtotal === 0}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          🧾 Fechar Conta
        </button>
      </div>

      {/* Resumo da Comanda Atual (Itens já pedidos) */}
      <div className="bg-[#1a202c] p-4 rounded-xl border border-gray-800 mb-8">
        <h2 className="text-lg font-bold text-gray-200 mb-3 border-b border-gray-700 pb-2">
          Consumo da Mesa
        </h2>

        {!session || session.orders.length === 0 ? (
          <p className="text-gray-400 text-sm italic">Nenhum pedido realizado ainda nesta mesa.</p>
        ) : (
          <div className="space-y-4">
            {session.orders.map((order, idx) => (
              <div key={order.id} className="bg-[#0f172a] p-3 rounded-lg border border-gray-800">
                <div className="flex justify-between text-xs text-amber-500 font-semibold mb-2">
                  <span>Pedido #{idx + 1}</span>
                  <span className="uppercase">{order.status}</span>
                </div>
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-300">
                    <span>{item.quantity}x {item.name}</span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ))}

            <div className="flex justify-between items-center pt-2 border-t border-gray-700 text-lg font-bold text-amber-400">
              <span>Subtotal Acumulado:</span>
              <span>R$ {session.subtotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Botão de envio caso existam itens no carrinho local */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto bg-amber-500 text-slate-950 p-4 rounded-xl shadow-2xl flex justify-between items-center z-40">
          <div>
            <p className="font-bold">{cart.reduce((acc, i) => acc + i.quantity, 0)} itens selecionados</p>
            <p className="text-xs font-semibold">Prontos para disparar para a cozinha</p>
          </div>
          <button
            onClick={handleSendOrder}
            className="bg-slate-950 hover:bg-black text-amber-400 font-extrabold py-2 px-6 rounded-lg transition"
          >
            Enviar Pedido 🚀
          </button>
        </div>
      )}

      {/* Modal de Impressão da Pré-Nota ao fechar */}
      {receiptData && (
        <ReceiptModal 
          receipt={receiptData} 
          onClose={() => setReceiptData(null)} 
        />
      )}
    </div>
  );
}