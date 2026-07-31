import { gql } from 'graphql-tag';

export const GET_ME = gql`
    query GetMe { 
    me {
        name 
        email 
        role 
        address {
          cep 
          street 
          number 
          }
      }
    }
`;

export const GET_TABLE_SESSION = gql`
    query GetTableSessions($table_number: Int!) {
        getTableSessions(table_number: $table_number) {
            id
            table_number
            status
            subtotal
            orders {
                id
                status
                total
                items {
                    name
                    quantity
                    price
                }
            }
        }
    }
`;

export const REGISTER_MUTATION = gql`
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

export const ADD_ITEM_TO_TABLE = gql `
    mutation AddItemToTable($table_number: Int!, $items: [CartItemInput!]!) {
        addItemToTable(table_number: $table_number, items: $items) {
            id
            subtotal
            orders {
                id
                items {
                    name
                    quantity
                    price
                }
            }
        }
    }
`;

export const CLOSE_TABLE_SESSION = gql `
    mutation CloseTableSession($table_number: Int!) {
        closeTableSessions(table_number: $table_number) {
            table_number
            total_amount
            close_at
            items_summary {
                name
                total_quantity
                unit_price
                total_price
            }
        }
    }
`;