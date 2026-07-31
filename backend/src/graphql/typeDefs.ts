import { gql } from 'graphql-tag';

export const typeDefs = gql`
    enum Role {
        ADMIN
        EMPRESA
        ATENDENTE
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

    enum TableStatus {
        LIVRE
        OCUPADA
        AGUARDANDO_PAGAMENTO
        ENCERRADA
    }

    enum ProductCategory {
        PIZZA
        BEBIDA
        SOBREMESA
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
        category: ProductCategory
        price: Float!
        stock_quantity: Int!
        ingredients: [String!]!
        foto_url: String
    }

    type Location { lat: Float! long: Float!}

    type Order {
        id: ID!
        client_id: ID!
        items: [CartItem!]! 
        total: Float!
        status: OrderStatus!
        payment_id: String
        driver_location: Location
        created_by: ID!
        created_at: String!
    }

    type CartItem {
        product_id: ID!
        name: String
        price: Float
        quantity: Int!
    }

    input CartItemInput {
        product_id: ID!
        quantity: Int!
    }

    type TableSession {
        id: ID!
        table_number: Int!
        status: TableStatus!
        orders: [Order!]!
        subtotal: Float!
        created_by: String!
        created_at: String!
        closed_at: String
        closed_by: String
    }

    type Table {
    id: ID!
    number: Int!
    capacity: Int
    status: TableStatus!
    }

    input AddressInput{
        cep: String!
        street: String!
        number: String!
        lat: Float
        long: Float
    }

    # Operaçãoes de Leitura (Substiu os GETs)
    type Query {
        me: User!
        listProducts(search: String): [Product!]!
        getProduct(id: ID!): Product!
        trackOrder(id: ID!): Order!
        listOrders: [Order!]!
        customerOrders: [Order!]!

        getActiveTableSessions: [TableSession!]!
        getTableSessions(table_number: Int!): TableSession
        getAllTables: [Table!]!
        
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
        registerUser(name: String!, email: String!, password_hash: String!, role: Role!, address: AddressInput): String!
        loginUser(email: String!, password_hash: String!): String!
        updateProfile(name: String!, address: AddressInput!): User!
        createProduct(name: String!, category: ProductCategory,  price: Float!, stock_quantity: Int!, ingredients: [String!]!): Product!
        updateProduct(id: ID!, name: String, category: ProductCategory, price: Float, stock_quantity: Int, ingredients: [String!]!, foto_url: String): Product!
        uploadProductImage(id: ID!, base64Image: String!) : Product!
        checkoutOrder(items: [CartItemInput!]!, total_price: Float!): Order!
        updateDriverLocation(orderId: ID!, lat: Float!, long: Float!): String!
        updateOrderStatus(orderId: ID!, status: OrderStatus!): String!

        openTableSession(table_number: Int!): TableSession!
        addItemToTable(table_number: Int!, items: [CartItemInput!]!) : TableSession!
        closeTableSession(table_number: Int!) : TableSessionReceipt!
        createTable(number: Int!, capacity: Int): Table!
        deleteTable(number: Int!): Boolean!
        
    }

    type TableSessionReceipt {
        table_number: Int!
        items_summary: [OrderItemSummary!]!
        total_amount: Float!
        closed_at: String!
    }

    type OrderItemSummary {
        name: String!
        total_quantity: Int!
        unit_price: Float!
        total_price: Float!
    }

`;