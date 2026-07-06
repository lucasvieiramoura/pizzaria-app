import { useState } from "react";
import { gql } from '@apollo/client/core';
import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';

const REGISTER_MUTATION = gql`
  mutation Register(
    $name: String!, 
    $email: String!, 
    $password: String!, 
    $role: Role!,
    $address: AddressInput!
  ) {
    registerUser(    
      name: $name, 
      email: $email, 
      password_hash: $password, 
      role: $role, 
      address: $address
    )
  }
`;
export function Register() {
    const [formData, setFormData] = useState({name:'', email:'', password: '', role: 'CLIENTE', cep: '', street: '', number: ''});
    const [registerUser, {loading}] = useMutation(REGISTER_MUTATION);
    const navigate = useNavigate();

    const handleSubmit = async (e) =>{
        e.preventDefault();
        try {
            await registerUser({ variables: {
                name: formData.name, email: formData.email, password: formData.password, role: formData.role, 
                address: { cep: formData.cep, street: formData.street, number: formData.number, lat: 0, long: 0}
            }});
            alert('Cadastro realizado com sucesso!');
            navigate('/login');
        } catch (err) { alert(err.message);}
    };

    return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 text-white">
      <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-2xl max-w-md w-full space-y-4 border border-gray-800">
        <h2 className="text-2xl font-bold text-center text-orange-500">Criar sua Conta</h2>
        <input type="text" placeholder="Nome Completo" required className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setFormData({...formData, name: e.target.value})} />
        <input type="email" placeholder="E-mail" required className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setFormData({...formData, email: e.target.value})} />
        <input type="password" placeholder="Senha" required className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setFormData({...formData, password: e.target.value})} />
        <select className="w-full bg-gray-800 p-3 rounded-xl text-gray-400" onChange={e => setFormData({...formData, role: e.target.value})}>
          <option value="CLIENTE">Cliente (Fazer Pedidos)</option>
          <option value="EMPRESA">Empresa (Gerenciar Pizzaria)</option>
          <option value="ENTREGADOR">Entregador</option>
        </select>
        <div className="grid grid-cols-3 gap-2">
          <input type="text" placeholder="CEP" required className="bg-gray-800 p-3 rounded-xl col-span-1" onChange={e => setFormData({...formData, cep: e.target.value})} />
          <input type="text" placeholder="Rua" required className="bg-gray-800 p-3 rounded-xl col-span-2" onChange={e => setFormData({...formData, street: e.target.value})} />
        </div>
        <input type="text" placeholder="Número / Complemento" required className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setFormData({...formData, number: e.target.value})} />
        <button type="submit" disabled={loading} className="w-full bg-orange-600 font-bold p-3 rounded-xl hover:bg-orange-500 transition">
          {loading ? 'Cadastrando...' : 'Finalizar Registro'}
        </button>
      </form>
    </div>
  );
} 