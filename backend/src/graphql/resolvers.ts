require('dotenv').config();
import { ObjectId, ReturnDocument } from "mongodb";
import bcrypt  from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthenticationError, ForbiddenError } from 'apollo-server-errors';

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const SECRET_KEY = process.env.SECRET_KEY ?? '';

cloudinary.config({
    cloud_name:'seu_cloud_name',
    api_key: 'seu_api_key',
    api_secret: 'seu_api_secret'
});

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
        listProducts:async (_ :  any, {search } :  {search?: string}, { db }:{ db: any}) => {
            try {
                const query: any = {};
                if(search) {
                    query.$or = [
                        {name: {$regex: search, $options: 'i'}},
                        {ingredients: { $regex: search, $options: 'i'}}
                    ];
                }
                const products = await db.collection('products').find(query).toArray();
                
                return products.map((product: { _id: any; [key: string]: any}) => ({
                    ...product,
                    id: product._id.toString(),
                    foto_url: product.foto_url
                }));
            } catch (error: any){
                    throw new Error('Erro ao buscar lista de produtos: '+error.message);
            }
        },
        getProduct: async(_: any, { id }: any, { db }: any ) =>{
            return await db.collection('products').findOne({_id: new ObjectId(id)});
        },
        
        trackOrder: async (_: any, { id } : any, { db } : any) => {
            return await db.collection('orders').findOne({ _id: new ObjectId(id) });

        },
        listOrders: async (_:any, _agrs: any, {db}:{db :any}) =>{
            const orders = await db.collection('orders').find().sort({_createdAt: -1}).toArray();

            return orders.map((order:any) =>({
                ...order,
                id: order._id.toString()
            }));
        },
        customerOrders: async (_: any, _args : any,  {db , user} : {db:any, user:any}) =>{
            if(!user){
                throw new Error("Usuário não autenticado");
            }
            const orders = await db.collection('orders').find({ client_id: new ObjectId(user._id)}).sort({ _id: -1}).toArray();
            return orders.map((order: any) => ({
                ...order,
                id: order._id.toString()
            }));
        },
        getDashboardOrders: async (_: any, __: any, {db, user}: any ) =>{
            if(!user || !['ADMIN','EMPRESA'].includes(user.role)) throw new ForbiddenError("Não autorizado");
            return await db.collection('orders').find().toArray();
        },
        getDashboardMetrics: async (_: any, __: any, { db, user } : any) => {
            verifyRole(user, ['ADMIN','EMPRESA']);

            const orders = await db.collection('orders').find().toArray();
            const total_revenue = orders.reduce((acc: number, curr: any) => acc + curr.total_price, 0);
            const low_stock_products = await db.collection('products').find({ stock_quantity: { $lt: 10 } }).toArray();

            return{
                total_revenue,
                total_orders: orders.length,
                low_stock_products
            };
        }
    },

    Mutation: {
        registerUser: async (_: any, { name, email, password_hash, role, address } : any, { db } : any) => {
            const exists = await db.collection('users').findOne({ email });
            if(exists) throw new Error("E-mail já cadastrado");

            const hashedPassword = await bcrypt.hash(password_hash, 10);
            await db.collection('users').insertOne({name, email, password_hash: hashedPassword, role, address});
            return "Usuário registrado com sucesso";
        },

        loginUser: async (_: any, { email, password_hash } : any, { db } : any) => {
            const user = await db.collection('users').findOne({ email });
            if(!user || !(await bcrypt.compare(password_hash, user.password_hash))) {
                throw new AuthenticationError("E-mail ou senha inválidos");
            }
            return jwt.sign({ id: user._id, role: user.role },SECRET_KEY,{ expiresIn: '1h' });
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
            const result = await db.collection('products').insertOne(agrs);
            return { id: result.insertedId, ...agrs };
        },

        updateProduct: async (_: any, {id,name, price, stock_quantity, ingredients, foto_url }: any, { db, user }: any ) =>{
            if (!user || !['ADMIN','EMPRESA'].includes(user.role)) throw new ForbiddenError("Acesso restrito.");
            const result = await db.collection('products').findOneAndUpdate(
                {_id: new ObjectId(id)},
                {$set: {
                    name,
                    price: parseFloat(price),
                    stock_quantity: parseInt(stock_quantity,10),
                    ingredients,
                    foto_url, 
                }},
                {ReturnDocument: 'after'}
            );

            if(result.matchedCount === 0){
                throw new Error('Produto não encontado no banco de dados');
            }
            return { ...result, id: result._id.toString() };
        },

        uploadProductImage: async (_: any, { id, base64Image }: any, { db, user }: any) => {
            if (!user || user.role !== 'ADMIN') {
                throw new Error("Não autorizado. Operação restrita a administradores.");
            }
            
            try {
                if (!base64Image) throw new Error("Nenhuma string de imagem recebida");

            const limpoBase64 = base64Image.includes(',') 
                ? base64Image.split(',')[1] 
                : base64Image;

            const buffer = Buffer.from(limpoBase64, 'base64');

            // Definição dos caminhos
            const nomeArquivo = `pizza-${id}-${Date.now()}.jpg`;
            const pastaUploads = path.join(__dirname, '..', '..', 'public', 'uploads');
            const caminhoDestino = path.join(pastaUploads, nomeArquivo);

            // 💡 Garante que a pasta public/uploads existe no disco antes de gravar
            if (!fs.existsSync(pastaUploads)){
                fs.mkdirSync(pastaUploads, { recursive: true });
            }

            // 💾 SALVA O ARQUIVO FISICAMENTE NO DISCO
            fs.writeFileSync(caminhoDestino, buffer);

            // 🌐 Caminho relativo para salvar no banco (para o src da tag <img> ler certo)
            const urlSalvarNoBanco = `/uploads/${nomeArquivo}`;

            // 🔍 VALIDAÇÃO DO OBJETO DE BANCO (Evita o 'undefined')
            if (!db) {
                throw new Error("O objeto 'db' não foi encontrado no contexto do GraphQL.");
            }
        
            const produtoAtualizado = await db.collection('products').findOneAndUpdate(
                {_id: new ObjectId(id)},
                { 
                    $set: { foto_url: urlSalvarNoBanco } 
                },
                {ReturnDocument: 'after'}
            );
            
            if (!produtoAtualizado) {
                throw new Error("Produto não encontrado para atualizar.");
            }
            
            return {
                id: produtoAtualizado._id ? produtoAtualizado._id.toString() : id,
                name: produtoAtualizado.name,
                foto_url: produtoAtualizado.foto_url
            };
        
            } catch (error: any) {
                const mensagemReal = error?.message || String(error);
                throw new Error(`Falha ao processar e salvar imagem: ${mensagemReal}`);
            }

        },

        checkoutOrder: async (_: any, { items, total_price } : any, { db, user } : any) => { //verificar para usar payment_id
            checkAuth(user);
            verifyRole(user, ['CLIENTE']);

            // Verificação de Estoque Atômica
            for (const item of items) {
                const product = await db.collection('products').findOne({ _id: new ObjectId(item.product_id) });
                if(!product || product.stock_quantity < item.quantity) {
                    throw new Error(`Estoque insuficeinte do item: ${product?.name || 'Desconhecido'}`);
                }  
            }

            // Simulação de gateway de pagamento aprovado (MercadoPago / PagSeguro)
            const payment_id = "PAY-" + Math.floor(Math.random() * 1000000);

            // 2. Transação de Débito de Estoque
            for (const item of items) {
                await db.collection('products').updateOne(
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

            const result = await db.collection('orders').insertOne(newOrder);
            return { id: result.insertedId, ...newOrder };
        },

        updateDriverLocation: async (_: any, { orderId, lat, long } : any, { db, user } : any) => {
            verifyRole(user, ['ENTREGADOR']);
            await db.collection('orders').updateOne(
                { _id: new ObjectId(orderId) },
                { $set: { driver_location: { lat, long } } }
            );
            return "Localização do entregador atualizada com sucesso";
        },

        updateOrderStatus: async (_: any, { orderId, status } : any, { db, user } : any) => {
            verifyRole(user, ['ADMIN','EMPRESA']);
            const result = await db.collection('orders').findOneAndUpdate(
                { _id: new ObjectId(orderId) },
                { $set: { status } },
                { ReturnDocument: 'after'}
            );  

            if(result.matchedCount === 0){
                throw new Error('Pedido não encontrado');
            }            
            return status;
        }
    },
    Product: {
        id: (parent: { _id: any }) => parent._id
    },
};
