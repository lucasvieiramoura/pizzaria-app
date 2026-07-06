import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_ME = gql`
    query GetMe { me {name email address {cep street number }}}
`;

const UPDATE_PROFILE = gql`
    mutation UpdateProfile($name: String!, $address: AddressInput!d) {
        updateProfile(name: $name, address: $address) { name }
    }
`;

export function Profile () {
    const { data, loading } = useQuery(GET_ME);
    const [updateProfile] = useMutation(UPDATE_PROFILE);
    const [editData, setEditData] = useState({name: '', cep: '', street: '', number: ''});

    if (loading) return <div className='text-white p-6'>Buscando informação do perfil...</div>;

    const handleUpdate = async (e) =>{
        e.preventDefault();
        try {
            await updateProfile({ variables: {
                name: editData.name || data.me.name,
                address :{
                    cep: editData.cep || data.me.address.cep,
                    street: editData.street || data.me.address.street,
                    number: editData.number || data.me.address.number,
                    lat: 0.0, long: 0.0
                }
            }});
            alert('Perfil Atualziado');
        } catch (err) { alert(err.message); }
    };

    return (
        <div className='min-h-screen bg-gray-950 text-white p-6 max-w-md mx-auto'>
            <h2 className='text-2xl font-bold text-orange-500 mb-6'>Meu Perfil</h2>
            <div className='bg-gray-900 p-6 roudend-2xl border border-gray-800 mb-6 text-sm space-y-2'>
                <p><strong className="text-gray-400">E-mail fixo:</strong> {data?.me.email}</p>
                <p><strong className="text-gray-400">Endereço Atual:</strong> {data?.me.address?.street}, Nº {data?.me.address?.number} ({data?.me.address?.cep})</p>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4 bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <h3 className="font-bold text-gray-300">Atualizar Dados</h3>
                <input type="text" placeholder="Atualizar Nome" className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setEditData({...editData, name: e.target.value})} />
                <input type="text" placeholder="Mudar CEP" className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setEditData({...editData, cep: e.target.value})} />
                <input type="text" placeholder="Mudar Rua" className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setEditData({...editData, street: e.target.value})} />
                <input type="text" placeholder="Mudar Número" className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setEditData({...editData, number: e.target.value})} />
                <button type="submit" className="w-full bg-orange-600 font-bold p-3 rounded-xl">Salvar Alterações</button>
            </form>
        </div>
    );
}