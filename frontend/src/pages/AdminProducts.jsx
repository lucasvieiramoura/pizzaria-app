import { useState } from "react";
import { gql } from '@apollo/client/core';
import { useMutation, useQuery } from '@apollo/client/react';
//import { UploadFotoPizza } from "../components/UploadFotoPizza";
import './AdminProducts.css';

const API_URL = import.meta.env.VITE_API_URL;

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
  mutation UpdateProduct($id: ID!, $name: String!, $price: Float!, $stock_quantity: Int!, $ingredients: [String!]!, $foto_url: String){
    updateProduct(id: $id, name: $name, price: $price, stock_quantity: $stock_quantity, ingredients: $ingredients, foto_url: $foto_url) { id name price stock_quantity }
  }
`;

const UPLOAD_PRODUCT_IMAGE = gql`
    mutation UploadProductImage($id: ID!, $base64Image: String!){
        uploadProductImage(id: $id, base64Image: $base64Image){
            id
            foto_url
        }
    }
`;

export function AdminProducts() {
    const { data, loading, error, refetch } = useQuery(LIST_PRODUCTS);
    const [createProduct] = useMutation(CREATE_PRODUCT);
    const [updateProduct] = useMutation(UPDATE_PRODUCT, { refetchQueries: ['List'] });

    const [imagePreview, setPreviewUrl ] = useState(null);
    const [base64String, setBase64String ] = useState("");
    
   const [uploadImage ] = useMutation(UPLOAD_PRODUCT_IMAGE, {refetchQueries: ['List']});
    
    const [editingProductId, setEditingProductId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock_quantity: '',
        ingredients: '',
        foto_url: ''
    });

    const handleSubmit = async (e) => {
        
        e.preventDefault();

        const payload = {
            name: formData.name,
            price: parseFloat(formData.price),
            stock_quantity: parseInt(formData.stock_quantity, 10),
            ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(Boolean),
            foto_url: String(formData.foto_url)
        };

        try {
            if (editingProductId){
                await updateProduct({                    
                    variables: {
                        id: editingProductId,
                        foto_url: currentFormImgSource,
                        ...payload
                    }
                    
                });
                
                await handleConfirmUpload(editingProductId,currentFormImgSource);
                alert('Produto atualizado com sucesso');
            } else {
                await createProduct({
                    variables: payload
                });
                alert('Produto criado com sucesso');
            }
            setEditingProductId(null);
            setFormData({ name: '', price: '', stock_quantity: '', ingredients: '', foto_url:'' });
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
            ingredients: p.ingredients ? p.ingredients.join(', ') : '',
            foto_url: p.foto_url
        });
    };

    const handleCancel = () => {
        setEditingProductId(null);
        setFormData({ name: '', price: '', stock_quantity: '', ingredients: '',foto_url:'' });
    };

   // Busca a URL da foto atual do produto que está sendo editado (se houver um selecionado)
    const productBeingEdited = data?.listProducts?.find(p => p.id === editingProductId);
    const currentFormImgSource = productBeingEdited?.foto_url 
        ? `${API_URL}${productBeingEdited.foto_url}` 
        : 'https://placehold.co/400x300?text=Sem+Foto';

    if (loading) return <div className="p-6 text-white text-center">Carregando cardápio...</div>;
    if (error) return <div className="p-6 text-red-500 text-center">Erro: {error.message}</div>;

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file){
            // 1. Atualiza o preview visual na tela
            setPreviewUrl(URL.createObjectURL(file));

            const reader = new FileReader();
            reader.onload = (e) => {
            const resultadoString = e.target.result;
            
            if (typeof resultadoString === 'string' && resultadoString.length > 0) {
                console.log("🚀 Sucesso! Base64 gerado com tamanho:", resultadoString.length);
                const apenasBase64 = resultadoString.split(',')[1];
                setBase64String(apenasBase64);
            } else {
                console.error("❌ Falha crítica: O FileReader não gerou uma string válida.");
            }
        };
            reader.readAsDataURL(file);
        }
    };

    const handleConfirmUpload = async (id, foto) =>{
        if (!base64String) return;
     
        try {
            await uploadImage({                
                variables: {
                    id: id || editingProductId.toString(),
                    base64Image: base64String || foto
                }
            });

            alert("Id Equipamento: "+editingProductId);
            setBase64String("");
            refetch();
            
        } catch (err) {
           // 🔍 Printa o objeto estruturado no console para você conseguir abrir as setinhas (F12)
                console.error("Erro completo do Apollo:", err);
                console.log("Detalhes das falhas:", JSON.stringify(err, null, 2));

                // Se o GraphQL devolveu uma mensagem de erro tratada pelo back-end
                if (err.graphQLErrors && err.graphQLErrors.length > 0) {
                    alert(`Erro no Servidor: ${err.graphQLErrors[0].message}`);
                } 
                // Se foi um erro de rede ou HTTP (como o status 400 ou 500)
                else if (err.networkError) {
                    // Se houver mensagens detalhadas dentro do erro de rede
                    const networkMsgs = err.networkError.result?.errors?.map(e => e.message).join(', ');
                    alert(`Erro de Rede: ${networkMsgs || err.networkError.message}`);
                } 
                // Fallback genérico caso não seja nenhum dos dois
                //else {
                //    alert(`Erro genérico: ${err.message || 'Falha desconhecida'}`);
                //}
        }
    }

    return (
    <div className="admin-container">
        
        {/* TOPO DA TELA */}
        <div className="admin-header">
            <div>
                <h1>Cardápio</h1>
                <p>{data?.listProducts?.length || 0} de {data?.listProducts?.length || 0} disponíveis</p>
            </div>
        </div>

        <div className="admin-layout">
            
            {/* COLUNA DO FORMULÁRIO */}
            <form onSubmit={handleSubmit} className="product-form">
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1A0D0A' }}>
                        {editingProductId ? 'Editar Produto / Pizza' : 'Preencha as informações do produto'}
                    </h3>
                </div>
                
                <div className="form-group">
                    <label>Nome do produto</label>
                    <input 
                        type="text" 
                        placeholder="Ex: Pizza Calabresa Especial" 
                        required 
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    />
                </div>

                <div className="form-group">
                    <label>Preço (R$)</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        placeholder="0,00" 
                        required 
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })} 
                    />
                </div>

                <div className="form-group">
                    <label>Quantidade em Estoque</label>
                    <input 
                        type="number" 
                        placeholder="Ex: 10" 
                        required 
                        value={formData.stock_quantity}
                        onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })} 
                    />
                </div>

                <div className="form-group">
                    <label>Descrição / Ingredientes</label>
                    <textarea 
                        placeholder="Descreva os ingredientes e diferenciais..." 
                        required 
                        rows={3}
                        value={formData.ingredients}
                        onChange={e => setFormData({ ...formData, ingredients: e.target.value })} 
                    />
                </div>
                
                <div className="form-group">
                    <label>Imagem do Produto</label>
                    {editingProductId ? (
                        <div className="form-upload-box" style={{ padding: '1rem', textAlign: 'center' }}>
                            
                            {/* Preview da Imagem Atual */}
                            <img 
                                src={imagePreview || currentFormImgSource}
                                alt="Preview" 
                                style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', marginBottom: '0.75rem', borderRadius: '8px' }} 
                            />   
                            <div className="hidden-uploader-wrapper">
                                <input 
                                type="file" 
                                id={`file-pizza-${editingProductId}`}
                                accept="image/*" 
                                onChange={handleFileChange} 
                                className="hidden"
                                />
                                <label 
                                    htmlFor={`file-pizza-${editingProductId}`}
                                    className="w-full text-center cursor-pointer bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 rounded-xl font-semibold transition"
                                >
                                    {imagePreview ? 'Trocar Imagem' : 'Selecionar Imagem'}
                                </label>  
                            </div>
                            
                        </div>
                    ) : (
                        <div className="form-upload-disabled">
                            <p>Selecione um produto cadastrado abaixo para alterar ou adicionar uma foto.</p>
                        </div>
                    )}
                </div>
                {base64String && (
                <button type="submit" className="btn-primary" >
                    { editingProductId ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
                )}
                {editingProductId && (
                    <button type="button" className="btn-secondary" onClick={handleCancel}>
                        Cancelar Edição
                    </button>
                )}
            </form>

            {/* COLUNA DA VITRINE DE CARDS */}
            <div className="products-grid">
                {data?.listProducts.map(p => {
                    const imgSource = p.foto_url ? `${API_URL}${p.foto_url}` : 'https://placehold.co/400x300?text=Sem+Foto';      
                    const isLowStock = p.stock_quantity <= 5;

                    return (
                        <div key={p.id} className="product-card">
                            
                            {/* 1. Imagem no Topo */}
                            <div className="card-image-wrapper">
                                <img 
                                    alt={p.name} 
                                    src={imgSource} 
                                    className="card-image"
                                    onError={(e) => {
                                        e.target.src = 'https://placehold.co/400x300?text=Pizza';
                                    }}
                                />
                                
                                {/* Badge de Estoque */}
                                <span className={`stock-badge ${isLowStock ? 'low-stock' : ''}`}>
                                    {isLowStock ? '⚠️ Baixo: ' : 'Estoque: '} {p.stock_quantity} un
                                </span>

                                {/* Ícone de Exclusão (Pronto para uso) */}
                                <button 
                                    type="button"
                                    className="btn-delete-card"
                                    title="Excluir Produto"
                                    onClick={() => alert('Função de exclusão será implementada posteriormente.')}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                </button>
                            </div>

                            {/* 2. Linhas de Detalhes abaixo da Imagem */}
                            <div className="card-content">
                                <div className="card-title-row">
                                    <h3 className="card-title">{p.name}</h3>
                                    <span className="card-price">R$ {Number(p.price).toFixed(2)}</span>
                                </div>
                                
                                <p className="card-description">
                                    {p.ingredients || 'Nenhum ingrediente informado.'}
                                </p>
                            </div>

                            {/* Badges Finais e Ações */}
                            <div className="card-footer">
                                <div className="badge-row">
                                    <span className="category-badge">Tradicionais</span>
                                    <span className="status-badge">
                                        <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#198754', borderRadius: '50%' }}></span>
                                        Disponível
                                    </span>
                                </div>

                                <button type="button" className="btn-edit-inline" onClick={() => handleEditClick(p)}>
                                    ✏️ Editar Detalhes
                                </button>
                            </div>

                        </div>
                    );
                })}
            </div>

        </div>
    </div>
);

    /*
    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* FORMULÁRIO //}
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

            {/* LISTAGEM //}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-gray-400">Estoque de Produtos Atual</h2>
                <div className="space-y-2">
                    {data?.listProducts.map(p => {
                        const imgSource = p.foto_url ? `${API_URL}${p.foto_url}` : 'https://placehold.co/300x200?text=Sem+Foto';      
                        return(                   
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
                                        currentImage={imgSource}
                                        onUploadSuccess={() => {
                                            // 🔄 Força a atualização da lista na tela para renderizar a nova imagem do Cloudinary instantaneamente
                                            refetch(); 
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
    */
}