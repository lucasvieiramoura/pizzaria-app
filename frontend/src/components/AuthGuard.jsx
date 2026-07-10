import { Navigate, Outlet } from 'react-router-dom';

import { gql } from '@apollo/client/core';
import { useQuery } from '@apollo/client/react';

const GET_ME = gql`
    query GetMe { 
    me {
        name
        role
        email 
    }
}
`;

export function AuthGuard() {
    const token = localStorage.getItem('@PizzaToken');
    const { data, loading } = useQuery(GET_ME, { skip: !token});


    if(!token) {
        return <Navigate to="/login" replace/>;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white text-sm">
                <div className="animate-pulse">Verificando permissões...</div>
            </div>
        );
    }

    if(data?.me.role !== 'ADMIN') {
       return <Navigate to="/" replace/>;
    }

    return <Outlet />;
}