import { gql } from '@apollo/client/core';
import { useMutation } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CHECKOUT_MUTATION = gql`
    mutation Checkout($items: [CartItemInput!]!, $total: Float!){
        checkoutOrder(items: $items, total_price: $total) {id}
    }
`;

export function Cart({ cartItems =[], clearCart, userAddress}){
    const [checkoutOrder, {loading}] = useMutation(CHECKOUT_MUTATION);
    const navigate = useNavigate();

    const total  = (cartItems || []).reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

    const [cep, setCep] = useState(userAddress?.cep || '');
    const [street, setStreet] = useState(userAddress?.street || '');
    const [number, setNumber] = useState(userAddress?.number || '');
    const [loadingCep, setLoadingCep] = useState(false);
    const [cepError, setCepError] = useState('');

    useEffect(() => {
        if(userAddress) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            if(userAddress.cep) setCep(userAddress.cep);
            if(userAddress.street) setStreet(userAddress.street);
            if(userAddress.number) setNumber(userAddress.number);
        }
    }, [userAddress]);

    useEffect(() => {
        const cleanCep = cep.replace(/\D/g, '');

        if(cleanCep.length == 8){
            const  fetchAddress = async () =>{
                setLoadingCep(true);
                setCepError('');
                try {
                    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                    const data = await response.json();

                    if (data.erro) {
                        setCepError('CEP não encontrado');
                        setStreet('');
                    }else {
                        setStreet(`${data.logradouro} - ${data.bairro}, ${data.localidade}/${data.uf}`);
                    }
                // eslint-disable-next-line no-unused-vars
                } catch (err) {
                    setCepError('Erro ao buscar o CEP. Tente digitar manualmente');
                } finally {
                    setLoadingCep(false);
                }
            };
            fetchAddress();
        } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStreet("");
        }
    }, [cep]);

    const handlePayment = async () => {
        if (cartItems.length === 0) return alert('Seu carrinho está vazio');

        if(!street || !number){
            alert("Por favor, preecha o endereço completo com o número");
            return;
        }

        try {
            const itemsPayload = cartItems.map(item => ({ product_id: item.id || item.product_id, quantity: parseInt(item.quantity || item.qtd)}));
            //const totalFloat = parseFloat(total);
            const { data } = await checkoutOrder({ variables: { items: itemsPayload,  total }});
            clearCart();
            alert('Pagamento integrado aprovado!');
            navigate(`/status/${data.checkoutOrder.id}`);
        } catch (err) { alert(err.message);}
    };

    const isFormValid = cartItems.length > 0 && number.trim() !== '' && !loadingCep ;

    return (
        <div className='min-h-screen bg-gray-950 text-white p-6 max-w-2xl mx-auto'>
            <h2 className='text-2xl font-black text-orange-500 mb-6'>Seu Carinho</h2>
            {cartItems.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
                Seu carrinho está vazio. Volte ao cardápio para escolher sua pizza!
            </div>
            ) :(
                <div className='max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6'>
                    {/* Coluna da Esquerda: Itens do Carrinho */}
                    <div className='md:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6 h-fit'>
                        <h2 className='text-xl font-bold mb-4 text-gray-200'>Revisar Itens</h2>
                        <div className='spcae-y-4 mb-6'>
                            {cartItems.map((item)=>(
                                <div key={item.id} className='flex justify-between items-center border-b border-gray-800 pb-4'>
                                    <div>
                                        <h3 className='font-bold text-white'>{item.name}</h3>
                                        <p className='text-sm text-gray-400'>Quantidade: {item.quantity}</p>
                                    </div>
                                    <span className='text-orange-500 font-bold'>
                                        R$ {(item.price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className='flex justigy-between items-center border-t border-gray-800 pt-4'>
                            <span className='font-semibold text-lg'> Total do Pedido: </span>
                            <span className='text-xl font-bold text-green-400'>R$ {total.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={clearCart}
                            className='mt-6 text-sm text-red-500 hover:underline block text-center w-full'
                        >
                            🗑️ Esvaziar Carrinho
                        </button>
                    </div>


                    {/* Coluna da Direita: Dados de Entrega e Checkout */}
                    <div className='bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col jusitigy-between h-fit'>
                        <div>
                            <h2 className='text-xl font-bold mb-4 text-gray-200'>🚀 Endereço de Entrega</h2>

                            <div className='space-y-4'>
                                {/* Campo de CEP */}
                                <div>
                                    <label className='text-xs text-gray-400 font-semibold block mb-1'>CEP</label>
                                    <input 
                                        type="text"
                                        maxLength="9"
                                        placeholder='00000-000'
                                        value={cep}
                                        onChange={(e) => setCep(e.target.value)}
                                        className='w-full bg-gray-900 border border-gray-800 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-orange-500'
                                    />
                                    {loadingCep && <span className='text-xs text-orange-400 mt-1 block'>Buscando endereço....</span>}
                                    {cepError && <span className='text-xs text-red-500 mt-1 block'>{cepError}</span>}
                                </div>

                                {/* Campo de rua (Preenchendo automaticamente) */}
                                <div>
                                    <label className='text-xs text-gray-400 font-semibold block mb-1'>Endereço</label>
                                    <input 
                                        type="text" 
                                        disabled
                                        placeholder='Preencha o CEP acima...'
                                        value={street}
                                        className='w-full bg-gray-950/50 border border-gray-800 text-gray-400 px-3 py-2 rounded-xl text-sm cursor-not-allowed'
                                    />
                                </div>
                                {/* Campo de Número */}
                                <div>
                                <label className="text-xs text-gray-400 font-semibold block mb-1">Número / Apto</label>
                                <input 
                                    type="text"
                                    placeholder="Ex: 152 Bloco B"
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                                />
                                </div>
                            </div>
                        </div>
                         <button onClick={handlePayment} disabled={ !isFormValid || loading} className="w-full mt-6 bg-green-600 p-4 rounded-xl font-black text-lg hover:bg-green-500 transition">
                                {loading ? 'Processando Pagamento...' : 'Pagar Agora'}
                            </button>
                    </div>
                    
                </div>

                
                
            )}
        </div>
    );
}

//

/*                      <div className='spcae-y-4'>
                            {cartItems.map((item, i) => (
                                <div key={i} className='flex justify-between bg-gray-900 p-4 rounded-xl border border-gray-800'>
                                    <div>
                                    <h4 className="font-bold">{item.name}</h4>
                                    <p className="text-sm text-gray-400">Quantidade: {item.quantity}</p>
                                </div>
                                <span className="text-orange-400 font-bold">R$ {(item.price.toFixed(2) * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="border-t border-gray-800 pt-4 flex justify-between text-xl font-bold">
                                <span>Total:</span>
                                <span className="text-green-400">R$ {total.toFixed(2)}</span>
                            </div>
                            <button onClick={handlePayment} disabled={ !isFormValid || loading} className="w-full mt-6 bg-green-600 p-4 rounded-xl font-black text-lg hover:bg-green-500 transition">
                                {loading ? 'Processando Pagamento...' : 'Pagar Agora'}
                            </button>
                        </div>
                            */