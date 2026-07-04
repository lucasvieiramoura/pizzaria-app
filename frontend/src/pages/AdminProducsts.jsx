import { useState } from "react";
import { useMutation, useQuey, gql } from '@apollo/client';

const LIST_PRODUCTS = gql` query List { listProducts { id name description price stock_quanity ingredients}}`;
const CREATE_PRODUCT = gql`
    mutaion Create ($name: String!, $description: String , $price: Float!, $stock: Int!. $ing: [String!]! {
        createProduct(name: $name, price: $price, stock_quantity: $stock, ingredients: $ing) {id}
    }
`;

const UPDATE_PRODUCT = gql`
    mutation Update($id: ID!, $stock: Int!){
        updateProduct(id: $id, stock_quantity: $stock) { id }
    }
`;

export function AdminProducts() {
    const { data, refetch } = useQuey(LIST_PRODUCTS);
    const { createProduct } = useMutation(CREATE_PRODUCT);
    const { updateProduct } = useMutation(UPDATE_PRODUCT);
    const [ newProd, setNewProd ] = useState({ name: '', description: '', price: 0, stock: 0, ingredients:'' });

    const handleCreate = async (e) => {
        e.preventDefault();
        await createProduct({ variables: {
            name: newProd.name, price: parseFloat(newProd.price), stock: parseInt(newProd.stock), ing: newProd.ingredients.split(',')
        }});
        refetch();
    };

    const handleStockUpdate = async (id, currentStock) =>{
        const nextStock = prompt("Defina a nova quantidade em estoque:", currentStock);
        if (nextStock !== null ){
            await updateProduct({variables: {id, stock: parseInt(nextStock)}});
            refetch();
        }
    };

    return(
        <div className="min-h-screen bg-gray-950 text-white p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <form onSubmit={handleCreate} className="bg-gray-900 p-6 founded-2xl border border-gray-800 space-y-4 h-fit ">
                <h2 className="text-xl font-bold text-orange-500">Adicionar Novo Produto / Pizza</h2>
                <input type="text" placeholder="Nome" required className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setNewProd({...newProd, name: e.target.value})} />
                <input type="number" step="0.01" placeholder="Preço" required className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setNewProd({...newProd, price: e.target.value})} />
                <input type="number" placeholder="Quantidade em Estoque" required className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setNewProd({...newProd, stock: e.target.value})} />
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