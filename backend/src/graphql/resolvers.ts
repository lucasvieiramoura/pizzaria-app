require('dotenv').config();
import { ObjectId } from "mongodb";
import bcrypt  from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthenticationError, ForbiddenError } from 'apollo-server-errors';


const SECRET_KEY = process.env.SECRET_KEY;

const checkAuth = (user: any) =>{
    if (!user)  throw new AuthenticationError("Sessão expirada ou usuário não autenticado.");
};

// Função utiilitária para travar papéis (Roles)
const verifyRole = (user: any, allowedRoles: string[]) => {
    if(!user) throw new AuthenticationError("Usuário não autenticado");
    if(!allowedRoles.includes(user.role)) throw new ForbiddenError("Acesso negado");
};

export const resolvers = {
    Query: {
        me: async (_: any, __: any, {db, user }: any ) =>{
            checkAuth(user);
            return await db.collection('users').findOne({_id: new ObjectId(user.id)});
        },
        listProducts: async (_: any, __: any, {db}: any) => {
            return await db.collections('products').find().toArray();
        },
        getProduct: async(_: any, { id }: any, { db }: any ) =>{
            return await db.collection('products').findOne({_id: new ObjectId(id)});
        },
        trackOrder: async (_: any, { order_id } : any, { db } : any) => {
            return await db.collections('orders').findOne({ _id: new ObjectId(order_id) });
        },
        getDashboardOrders: async (_: any, __: any, {db, user}: any ) =>{
            if(!user || !['ADMIN','EMPRESA'].includes(user.role)) throw new ForbiddenError("Não autorizado");
            return await db.collections('orders').find().toArray();
        },
        getDashboardMetrics: async (_: any, __: any, { db, user } : any) => {
            verifyRole(user, ['ADMIN','EMPRESA']);

            const orders = await db.collections('orders').find().toArray();
            const total_revenue = orders.reduce((acc: number, curr: any) => acc + curr.total_price, 0);
            const low_stock_products = await db.collections('products').find({ stock_quantity: { $lt: 10 } }).toArray();

            return{
                total_revenue,
                total_orders: orders.length,
                low_stock_products
            };
        }
    },

    Mutation: {
        registerUser: async (_: any, { name, email, password_hash, role, address } : any, { db } : any) => {
            const exists = await db.collections('users').findOne({ email });
            if(exists) throw new Error("E-mail já cadastrado");

            const hashedPassword = await bcrypt.hash(password_hash, 10);
            await db.collections('users').insertOne({name, email, password_hash: hashedPassword, role, address});
            return "Usuário registrado com sucesso";
        },

        loginUser: async (_: any, { email, password_hash } : any, { db } : any) => {
            const user = await db.collections('users').findOne({ email });
            if(!user || !(await bcrypt.compare(password_hash, user.password_hash))) {
                throw new AuthenticationError("E-mail ou senha inválidos");
            }
            return jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
        },

        updateProfile: async (_: any, { name, address }: any, { db, user}: any) =>{
            checkAuth(user);
            await db.collection('users').updateOne(
                {_id: new ObjectId(user.id)},
                { $set: {name, address}}
            );
            return await db.collection('users').findOne({_id: new ObjectId(user.id)});
        },

        createProduct: async (_: any, agrs: any, { db, user } : any) => {
            verifyRole(user, ['ADMIN','EMPRESA']);
            const result = await db.collections('products').insertOne(agrs);
            return { id: result.insertedId, ...agrs };
        },

        updateProduct: async (_: any, {id, ...updateData }: any, { db, user }: any ) =>{
            if (!user || !['ADMIN','EMPRESA'].includes(user.role)) throw new ForbiddenError("Acesso restrito.");
            await db.collection('products').updateOne(
                {_id: new ObjectId(id)},
                {$set: {updateData}},
            );
            return await db.collection('products').findOne({_id: new ObjectId(id)});
        },

        checkoutOrder: async (_: any, { items, total_price } : any, { db, user } : any) => { //verificar para usar payment_id
            checkAuth(user);
            verifyRole(user, ['CLIENTE']);

            // Verificação de Estoque Atômica
            for (const item of items) {
                const product = await db.collections('products').findOne({ _id: new ObjectId(item.product_id) });
                if(!product || product.stock_quantity < item.quantity) {
                    throw new Error(`Estoque insuficeinte do item: ${product?.name || 'Desconhecido'}`);
                }  
            }

            // Simulação de gateway de pagamento aprovado (MercadoPago / PagSeguro)
            const payment_id = "PAY-" + Math.floor(Math.random() * 1000000);

            // 2. Transação de Débito de Estoque
            for (const item of items) {
                await db.collections('products').updateOne(
                    { _id: new ObjectId(item.product_id) },
                    { $inc: { stock_quantity: -item.quantity } }
                );
            }

            const newOrder = {
                client_id: new ObjectId(user.id),
                items,
                total_price,
                status: "PAID",
                payment_id,
                driver_location: null,
                created_at: new Date().toISOString()
            }

            const result = await db.collections('orders').insertOne(newOrder);
            return { id: result.insertedId, ...newOrder };
        },

        updateDriverLocation: async (_: any, { orderId, lat, long } : any, { db, user } : any) => {
            verifyRole(user, ['ENTREGADOR']);
            await db.collections('orders').updateOne(
                { _id: new ObjectId(orderId) },
                { $set: { driver_location: { lat, long } } }
            );
            return "Localização do entregador atualizada com sucesso";
        },

        updateOrderStatus: async (_: any, { orderId, status } : any, { db, user } : any) => {
            verifyRole(user, ['ADMIN','EMPRESA']);
            await db.collections('orders').updateOne(
                { _id: new ObjectId(orderId) },
                { $set: { status } }
            );  
            return "Status do pedido atualizado com sucesso";
        }
    }
};
