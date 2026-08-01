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

export const LIST_PRODUCTS = gql`
    query ListProducts($search: String) {
        listProducts(search: $search) { 
        id 
        name 
        category
        price 
        stock_quantity 
        ingredients 
        foto_url
        }
    }
`;

export const LIST_ORDERS = gql`
    query ListOrders {
        listOrders {
            id
            total
            status
            items {
                product_id
                name
                quantity
            }
        }
    }
`;

export const GET_ALL_TABLES = gql`
  query GetAllTables {
    getAllTables {
      id
      number
      capacity
      status
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
                client_id
                status
                total
                created_by
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

export const CREATE_PRODUCT = gql`
  mutation Create ($name: String!, $category: ProductCategory!, $price: Float!, $stock_quantity: Int!, $ingredients: [String!]!) {
    createProduct(name: $name, category: $category, price: $price, stock_quantity: $stock_quantity, ingredients: $ingredients) { id }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $name: String!, $category: ProductCategory!, $price: Float!, $stock_quantity: Int!, $ingredients: [String!]!, $foto_url: String){
    updateProduct(id: $id, name: $name, category: $category, price: $price, stock_quantity: $stock_quantity, ingredients: $ingredients, foto_url: $foto_url) 
    { id name category price stock_quantity }
  }
`;
export const UPDATE_ORDER_STATUS = gql`
    mutation UpdateOrderStatus($orderId: ID!, $status: OrderStatus!){
        updateOrderStatus(orderId: $orderId, status: $status)
    }
`;

export const UPLOAD_PRODUCT_IMAGE = gql`
    mutation UploadProductImage($id: ID!, $base64Image: String!){
        uploadProductImage(id: $id, base64Image: $base64Image){
            id
            foto_url
        }
    }
`;

export const CREATE_TABLE = gql`
  mutation CreateTable($number: Int!, $capacity: Int) {
    createTable(number: $number, capacity: $capacity) {
      id
      number
      capacity
      status
    }
  }
`;

export const DELETE_TABLE = gql`
  mutation DeleteTable($number: Int!) {
    deleteTable(number: $number)
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
        closeTableSession(table_number: $table_number) {
            table_number
            total_amount
            closed_at
            items_summary {
                name
                total_quantity
                unit_price
                total_price
            }
        }
    }
`;