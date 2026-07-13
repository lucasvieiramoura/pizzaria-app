import { useState } from "react";
import { gql } from '@apollo/client/core';
import { useMutation } from '@apollo/client/react';

const UPLOAD_PRODUCT_IMAGE = gql`
    mutation UploadProductImage($id: ID!, $base64Image: String!){
        uploadProductImage(id: $id, base64Image: $base64Image){
            id
            foto_url
        }
    }
`;

export function UploadFotoPizza({productId, currentImage, onUploadSuccess }){
    const [previewUrl, setPreviewUrl ] = useState(currentImage || null);
    const [base64String, setBase64String ] = useState("");

    const [uploadImage, { loading }] = useMutation(UPLOAD_PRODUCT_IMAGE, {refetchQueries: ['List']});

    // 1. Captura o arquivo real e converte para Base64 de forma assícrona
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

    // 2. Enviar a string Base64 através do Mutation GraphQL
    const handleConfirmUpload = async () =>{
        if (!base64String) return;

        try {
            const { data } = await uploadImage({
                variables: {
                    id: String(productId),
                    base64Image: base64String
                }
            });

            alert("Foto do produto salva com sucesso no Mongo");
            setBase64String("");

            if(onUploadSuccess) {
                onUploadSuccess(data.uploadProductImage.foto_url);
            }
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
                else {
                    alert(`Erro genérico: ${err.message || 'Falha desconhecida'}`);
                }
        }
    }

    return (
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex flex-col items-center gap-4">
            {/* Exibição da foto atual ou do Preview */}
            <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-950 border border-gray-800 flex items-center justify-center">
               
            </div>

            <div className="w-full flex flex-col gap-2">
                <input 
                    type="file" 
                    id={`file-pizza-${productId}`}
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden"
                />
                <label 
                    htmlFor={`file-pizza-${productId}`}
                    className="w-full text-center cursor-pointer bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 rounded-xl font-semibold transition"
                >
                    {previewUrl ? 'Trocar Imagem' : 'Selecionar Imagem'}
                </label>

                {base64String && (
                    <button
                        onClick={handleConfirmUpload}
                        disabled={loading}
                        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-800 text-white text-xs py-2 rounded-xl font-bold transition"
                    >
                        {loading ? 'Processando Upload...' : 'Confirmar e Atualizar no Banco'}
                    </button>
                )}
            </div>
        </div>            
    );
};