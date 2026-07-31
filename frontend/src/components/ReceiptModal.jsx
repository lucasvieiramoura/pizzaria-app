export default function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      {/* Container estilizado como cupom fiscal/conferência */}
      <div id="receipt-print" className="bg-white text-black p-6 rounded-lg max-w-sm w-full font-mono shadow-2xl">
        <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
          <h2 className="text-xl font-bold uppercase">PizzaDev</h2>
          <p className="text-xs text-gray-600">Conferência de Conta - Mesa {receipt.table_number}</p>
          <p className="text-xs text-gray-500">{new Date(receipt.closed_at).toLocaleString('pt-BR')}</p>
        </div>

        {/* Lista de Itens Agrupados */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between font-bold border-b pb-1 text-xs text-gray-500">
            <span>QTD ITEM</span>
            <span>TOTAL</span>
          </div>
          {receipt.items_summary.map((item, index) => (
            <div key={index} className="flex justify-between items-start text-xs">
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-gray-500">{item.total_quantity}x R$ {item.unit_price.toFixed(2)}</p>
              </div>
              <span className="font-bold">R$ {item.total_price.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Totalizador */}
        <div className="border-t border-dashed border-gray-400 pt-3 mb-6">
          <div className="flex justify-between text-base font-bold">
            <span>TOTAL MESA:</span>
            <span>R$ {receipt.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 print:hidden">
          <button 
            onClick={() => window.print()}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded transition"
          >
            🖨️ Imprimir
          </button>
          <button 
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}