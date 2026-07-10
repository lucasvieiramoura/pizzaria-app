import { useState } from "react";
import { gql } from '@apollo/client/core';
import { useMutation, useQuery } from '@apollo/client/react';
import { UploadFotoPizza } from "../components/UploadFotoPizza";

const LIST_PRODUCTS = gql` 
  query List { 
    listProducts { id name price stock_quantity foto_url ingredients }
  }
`;

const CREATE_PRODUCT = gql`
  mutation Create ($name: String!, $price: Float!, $stock_quantity: Int!, $ingredients: [String!]!) {
    createProduct(name: $name, price: $price, stock_quantity: $stock_quantity, ingredients: $ingredients) { id }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $name: String!, $price: Float!, $stock_quantity: Int!, $ingredients: [String!]!){
    updateProduct(id: $id, name: $name, price: $price, stock_quantity: $stock_quantity, ingredients: $ingredients) { id name price stock_quantity }
  }
`;

export function AdminProducts() {
    const { data, loading, error, refetch } = useQuery(LIST_PRODUCTS);
    const [createProduct] = useMutation(CREATE_PRODUCT);
    const [updateProduct] = useMutation(UPDATE_PRODUCT, { refetchQueries: ['List'] });
    
    const [editingProductId, setEditingProductId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock_quantity: '',
        ingredients: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            name: formData.name,
            price: parseFloat(formData.price),
            stock_quantity: parseInt(formData.stock_quantity, 10),
            ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(Boolean)
        };

        try {
            if (editingProductId){
                await updateProduct({
                    variables: {
                        id: editingProductId,
                        ...payload
                    }
                });
                alert('Produto atualizado com sucesso');
            } else {
                await createProduct({
                    variables: payload
                });
                alert('Produto criado com sucesso');
            }
            setEditingProductId(null);
            setFormData({ name: '', price: '', stock_quantity: '', ingredients: '' });
            refetch(); // Garante a atualização da lista
        } catch (err) {
            console.error('Erro na operação', err);
            alert('Erro: ' + err.message);
        }
    };

    const handleEditClick = (p) => {
        setEditingProductId(p.id);
        setFormData({
            name: p.name,
            price: p.price,
            stock_quantity: p.stock_quantity,
            ingredients: p.ingredients ? p.ingredients.join(', ') : ''
        });
    };

    const handleCancel = () => {
        setEditingProductId(null);
        setFormData({ name: '', price: '', stock_quantity: '', ingredients: '' });
    };

    if (loading) return <div className="p-6 text-white text-center">Carregando cardápio...</div>;
    if (error) return <div className="p-6 text-red-500 text-center">Erro: {error.message}</div>;
    
    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* FORMULÁRIO */}
            <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4 h-fit">
                <h2 className="text-xl font-bold text-orange-500">
                    {editingProductId ? 'Editar Produto / Pizza' : 'Adicionar Novo Produto / Pizza'}
                </h2>
                
                <input 
                    type="text" 
                    placeholder="Nome" 
                    required 
                    className="w-full bg-gray-800 p-3 rounded-xl" 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
                <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Preço" 
                    required 
                    className="w-full bg-gray-800 p-3 rounded-xl" 
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })} 
                />
                <input 
                    type="number" 
                    placeholder="Quantidade em Estoque" 
                    required 
                    className="w-full bg-gray-800 p-3 rounded-xl" 
                    value={formData.stock_quantity}
                    onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })} 
                />
                <input 
                    type="text" 
                    placeholder="Ingredientes (separados por vírgula)" 
                    required 
                    className="w-full bg-gray-800 p-3 rounded-xl" 
                    value={formData.ingredients}
                    onChange={e => setFormData({ ...formData, ingredients: e.target.value })} 
                />
                
                <button type="submit" className="w-full bg-green-600 font-bold p-3 rounded-xl hover:bg-green-700 transition">
                    {editingProductId ? 'Atualizar Produto' : 'Salvar Produto'}
                </button>
                
                {editingProductId && (
                    <button 
                        type="button" 
                        className="w-full bg-gray-700 font-bold p-3 rounded-xl hover:bg-gray-600 transition text-gray-200"
                        onClick={handleCancel}
                    >
                        Cancelar Edição
                    </button>
                )}
            </form>

            {/* LISTAGEM */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-gray-400">Estoque de Produtos Atual</h2>
                <div className="space-y-2">
                    {data?.listProducts.map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-gray-800 p-3 rounded-xl gap-2">
                            <span className="flex-1 truncate">{p.name} - R$: {p.price} - (Qtd: {p.stock_quantity})</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditClick(p)} className="bg-orange-600 text-xs px-3 py-2 rounded-lg font-semibold hover:bg-orange-700">
                                    Editar Tudo 
                                </button>
                            </div>
                            <div className="border-t border-b border-gray-800/60 py-3">
                                <UploadFotoPizza 
                                    productId={p.id} 
                                    currentImage={p.foto_url}
                                    onUploadSuccess={() => {
                                        // 🔄 Força a atualização da lista na tela para renderizar a nova imagem do Cloudinary instantaneamente
                                        refetch(); 
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
    
}