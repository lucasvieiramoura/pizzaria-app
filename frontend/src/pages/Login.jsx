import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

const LOGIN_MUTATION = gql`
    mutation Login($email: String!, $password: String!) {
        loginUser(email: $email, password_hash: $password)
    }
`;

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginUser] = useMutation(LOGIN_MUTATION);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data } = await loginUser({ variables: {email, password}});
            localStorage.setItem('@PizzaToken', data.loginUser);
            navigate('/home');
            window.location.reload();
        } catch (errr) {alert(errr.message)}
    };

    return (
        <div className='min-h-screen bg-gray-950 flex items-center justify-center text-white'>
            <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded-2xl w-full max-w-sm border border-gray-800 space-y-4">
                <h2 className="text-3xl font-black text-orange-500 text-center">PizzaDev 🍕</h2>
                <input type="email" placeholder="Seu e-mail" required className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Sua senha" required className="w-full bg-gray-800 p-3 rounded-xl" onChange={e => setPassword(e.target.value)} />
                <button type="submit" className="w-full bg-orange-600 font-bold p-3 rounded-xl hover:bg-orange-500">Entrar</button>
            </form>
        </div>
    );
}