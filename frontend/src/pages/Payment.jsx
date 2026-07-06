export function Payment ({ total, onConfirmPayment }) {
    return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl max-w-sm w-full text-center space-y-6">
        <h2 className="text-2xl font-bold text-orange-500">Tela de Pagamento</h2>
        <p className="text-gray-400 text-sm">Selecione o método de integração simulada para o valor de:</p>
        <div className="text-3xl font-black text-green-400">R$ {total.toFixed(2)}</div>
        
        <div className="space-y-2 text-left">
          <label className="flex items-center space-x-3 bg-gray-800 p-3 rounded-xl cursor-pointer">
            <input type="radio" name="gateway" defaultChecked className="text-orange-500 focus:ring-0" />
            <span>Mercado Pago (Cartão / Pix)</span>
          </label>
          <label className="flex items-center space-x-3 bg-gray-800 p-3 rounded-xl cursor-pointer">
            <input type="radio" name="gateway" className="text-orange-500 focus:ring-0" />
            <span>PagSeguro UOL</span>
          </label>
        </div>

        <button onClick={onConfirmPayment} className="w-full bg-green-600 hover:bg-green-500 p-3 rounded-xl font-bold transition">
          Confirmar Transação Online
        </button>
      </div>
    </div>
  );
}