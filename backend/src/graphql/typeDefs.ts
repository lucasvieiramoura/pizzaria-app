import { gql } from 'graphql-tag';

export const typeDefs = gql`
    enum Role {
        ADMIN
        EMPRESA
        CLIENTE
        ENTREGADOR
    }

    enum OrderStatus {
        PENDING
        PAID
        PREPARING
        READY
        DELIVERING
        DELIVERED
        CANCELED
    }

    type User {
        id: ID!
        name: String!
        email: String!
        role: Role!
        address: Address
        phone: String
    }

    type Address {
        cep: String!
        street: String!
        aditional: String
        number: String!
        lat: Float!
        long: Float!
    }

    type Product {
        id: ID!
        name: String!
        description: String
        price: Float!
        stock_quantity: Int!
        ingredients: [String!]!
    }

    type Location { lat: Float! long: Float!}

    type Order {
        id: ID!
        client_id: ID!
        items: [CartItemOutput!]!
        total_price: Float!
        statsus: OrderStatus!
        payment_id: String
        driver_location: Location
        created_at: String!
    }

    type CartItem{
        product_id: ID!
        name: String
        price: Float
        quantity: Int!
    }

    input CartItemInput {
        product_id: ID!
        quantity: Int!
    }

    input AddressInput{
        cep: String!
        street: String!
        number: String!
        lat: Float
        long: Flot
    }

    # Operaçãoes de Leitura (Substiu os GETs)
    type Query {
        me: User!
        listProducts: [Product!]!
        getProduct(id: ID!): Product!
        trackOrder(orderId: ID!): Order!
        getDashboardOrders: [Order!]!
        getDashboardMetrics: DashboardMetrics!
    }

    type DashboardMetrics {
        total_revenue: Float!
        total_orders: Int!
        low_stock_products: [Product!]!
    }

    # Operações de Escrita (Substitui os POST, PUT e DELETE)
    type Mutation {
        registerUser(name: String!, email: String!, password_hash: String!, role: Role!): String!
        loginUser(email: String!, password_hash: String!): String!
        updateProfile(name: String!, address: AddressInput!): User!
        createProduct(name: String!, price: Float!, stock_quantity: Int!, ingredients: [String!]!): Product!
        updateProduct(id: ID!, name: String, price: Float, stock_quantity: Int, ingredients: [String!]!): Product!
        checkoutOrder(items: [CartItemInput!]!, total_price: Float!): Order!
        updateDriverLocation(orderId: ID!, lat: Float!, long: Float!): String!
        updateOrderStatus(orderId: ID!, status: OrderStatus!): String!
    }
`;