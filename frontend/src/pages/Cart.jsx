import { gql } from '@apollo/client/core';
import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';


const CHECKOUT_MUTATION = gql`
    mutation Checkout($items: [CartItemInput!]!, $total: Float!){
        checkoutOrder(items: $items, total_price: $total) {id}
    }
`;

export function Cart({ cartItems, clearCart }){
    const [checkoutOrder, {loading}] = useMutation(CHECKOUT_MUTATION);
    const navigate = useNavigate();

    const total = cartItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

    const handlePayment = async () => {
        if (cartItems.length === 0) return alert('Seu carrinho está vazio');

        try {
            const itemsPayload = cartItems.map(item => ({ product_id: item.id || item.product_id, quantity: parseInt(item.quanitty || item.qtd || 1, 10)}));
        
            const { data } = await checkoutOrder({ variables: { items: itemsPayload, total }});
            clearCart();
            alert('Pagamento integrado aprovadoo!');
            navigate(`/status/${data.checkoutOrder.id}`);
        } catch (err) { alert(err.message);}
    };

    return (
        <div className='min-h-screen bg-gray-950 text-white p-6 max-w-2xl mx-auto'>
            <h2 className='text-2xl font-black text-orange-500 mb-6'>Seu Carinho</h2>
            {cartItems.length === 0 ? <p className='text-gray-500'>Nenhum item adicionado no carrinho</p> :(
                <div className='spcae-y-4'>
                    {cartItems.map((item, i) => (
                        <div key={i} className='flex justify-between bg-gray-900 p-4 rounded-xl border border-gray-800'>
                            <div>
                            <h4 className="font-bold">{item.name}</h4>
                            <p className="text-sm text-gray-400">Quantidade: {item.quantity}</p>
                        </div>
                        <span className="text-orange-400 font-bold">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="border-t border-gray-800 pt-4 flex justify-between text-xl font-bold">
                        <span>Total:</span>
                        <span className="text-green-400">R$ {total.toFixed(2)}</span>
                    </div>
                    <button onClick={handlePayment} disabled={loading} className="w-full mt-6 bg-green-600 p-4 rounded-xl font-black text-lg hover:bg-green-500 transition">
                        {loading ? 'Processando Pagamento...' : 'Pagar Agora'}
                    </button>
                </div>
            )}
        </div>
    );
}