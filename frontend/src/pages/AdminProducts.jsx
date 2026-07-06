import { useState } from "react";
import { gql } from '@apollo/client/core';
import { useMutation } from '@apollo/client/react';
import { useQuery } from '@apollo/client/react';

const LIST_PRODUCTS = gql` query List { listProducts { id name price stock_quantity ingredients}}`;
const CREATE_PRODUCT = gql`
    mutation Create ($name: String!, $price: Float!, $stock_quantity: Int!, $ingredients: [String!]!) {
        createProduct(name: $name, price: $price, stock_quantity: $stock_quantity, ingredients: $ingredients) {id}
    }
`;

const UPDATE_PRODUCT = gql`
    mutation Update($id: ID!, $stock_quantity: Int!, $ingredients: [String!]!){
        updateProduct(id: $id, stock_quantity: $stock_quantity, ingredients: $ingredients) { id }
    }
`;

export function AdminProducts() {
    const { data, refetch } = useQuery(LIST_PRODUCTS);
    const [createProduct] = useMutation(CREATE_PRODUCT);
    const { updateProduct } = useMutation(UPDATE_PRODUCT);
    const [ newProd, setNewProd ] = useState({ name: '',  price: 0, stock_quantity: 0, ingredients:'' });

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createProduct({ variables: {
                name: newProd.name, price: parseFloat(newProd.price), stock_quantity: parseInt(newProd.stock_quantity,10)
                , ingredients: typeof newProd.ingredients === 'string' 
                    ? newProd.ingredients.split(',').map(item => item.trim())
                    : newProd.ingredients
            }});
            alert(`Produto ${newProd.name} criado !`);
            refetch();
        } catch (err) {
            console.error(err);
            alert('Erro ao criar produto: '+ err.message);
        }
    };

    const handleStockUpdate = async (id, currentStock) =>{
        const nextStock = prompt("Defina a nova quantidade em estoque:", currentStock);
        if (nextStock !== null ){
            await updateProduct({variables: {id, stock_quantity: parseInt(nextStock)}});
            refetch();
        }
    };

    return(
        <div className="min-h-screen bg-gray-950 text-white p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <form onSubmit={handleCreate} className="bg-gray-900 p-6 founded-2xl border border-gray-800 space-y-4 h-fit ">
                <h2 className="text-xl font-bold text-orange-500">Adicionar Novo Produto / Pizza</h2>
                <input type="text" placeholder="Nome" required className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setNewProd({...newProd, name: e.target.value})} />
                <input type="number" step="0.01" placeholder="Preço" required className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setNewProd({...newProd, price: e.target.value})} />
                <input type="number" placeholder="Quantidade em Estoque" required className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setNewProd({...newProd, stock_quantity: e.target.value})} />
                <input type="text" placeholder="Ingredientes (separados por vírgula)" required className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setNewProd({...newProd, ingredients: e.target.value})} />
                <button type="submit" className="w-full bg-green-600 font-bold p-3 rounded-xl">Salvar Produto</button>
            </form>

            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-gray-400">Estoque de Produtos Atual</h2>
                <div className="space-y-2">
                {data?.listProducts.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-gray-800 p-3 rounded-xl">
                    <span>{p.name} (Qtd: {p.stock_quantity})</span>
                    <button onClick={() => handleStockUpdate(p.id, p.stock_quantity)} className="bg-blue-600 text-xs px-3 py-1 rounded-lg">Alterar Estoque</button>
                    </div>
                ))}
                </div>
            </div>
        </div>
    )
}