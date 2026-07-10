import { Navigate, Outlet } from 'react-router-dom';

import { gql } from '@apollo/client/core';
import { useQuery } from '@apollo/client/react';

const GET_ME = gql`
    query GetMe { me {name email role address {cep street number }}}
`;

export function AuthGuard() {
    const token = localStorage.getItem('@PizzaToken');
     const { data } = useQuery(GET_ME);

    if(!token) {
        return <Navigate to="/login" replace/>;
    }

    if(data?.me.role !== 'ADMIN') {
        return <Navigate to="/" replace/>;
    }

    return <Outlet />;
}