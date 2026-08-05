require('dotenv').config();
import { ObjectId, ReturnDocument } from "mongodb";
import bcrypt  from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthenticationError, ForbiddenError } from 'apollo-server-errors';
import { OAuth2Client } from "google-auth-library";

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const SECRET_KEY = process.env.SECRET_KEY ?? '';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
        listProducts:async (_ :  any, {search, category} :  {search?: string, category?: string}, { db }:{ db: any}) => {
            try {
                const query: any = {};
                if(search) {
                    query.$or = [
                        {name: {$regex: search, $options: 'i'}},
                        {ingredients: { $regex: search, $options: 'i'}}
                    ];
                }
                if(category) {
                    query.category = category;
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
        customerOrders: async (_: any, __ : any,  {db , user} : {db:any, user:any}) =>{
            if(!user){
                throw new Error("Usuário não autenticado");
            }

            const orders = await db.collection('orders').find({ client_id: new ObjectId(user.id)}).sort({ _id: -1}).toArray();

            if (!orders) {
                 throw new Error('Dados não encontrados');
            }


            return orders.map((order: any) => ({
                ...order,
                id: order._id.toString()
            }));
        },

        getActiveTableSessions: async(_ : any, __ : any, {db} : any) =>{
            return await db.collection('table_sessions').find({status: { $ne : 'LIVRE'}}).toArray();
        },
        getTableSessions: async (_ : any, {table_number} : any, { db } : any) =>{
            const session =  await db.collection('table_sessions').findOne({
                table_number,
                status: { $in : ['OCUPADA','AGUARDANDO_PAGAMENTO']}
            });
            
            // 2. Se não houver sessão ativa para essa mesa, retorna null
            if (!session) return null;

            // 3. Retorna o objeto individual com o id convertido e orders tratados
            return {
                ...session,
                id: session._id.toString(),
                orders: (session.orders || []).map((order: any) => ({
                ...order,
                id: order.id || order._id?.toString() || new Date().getTime().toString()
                }))
            };
        },     
        getAllTables: async (_ :any, __ : any, { db, user } : any) => {
            const tables = await db.collection('tables').find().sort({ number: 1 }).toArray();

            return tables.map((table:any) =>({
                ...table,
                id: table._id.toString()
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
            
            const exists = await db.collection('users').findOne({email});
            //db.collection('users').findOne({ email });
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

        googleLogin: async (_: any, { idToken } : any, { db } : any) => {
            try 
            {
                const ticket = await googleClient.verifyIdToken({
                    idToken,
                    audience: process.env.GOOGLE_CLIENT_ID
                });
                const payload = ticket.getPayload();
                if (!payload) throw new Error("Token do Google inválido");

                const { email, name, picture, sub: googleId } = payload;

                let user = await db.collection('users').findOne({ email });
                if (!user) 
                {
                    const newUser = {
                        name,
                        email,
                        password_hash: '', // Sem senha, login apenas via Google
                        role: 'CLIENTE', // Definir um papel padrão para usuários do Google
                        address: null // Endereço inicialmente nulo
                    };
                    const result = await db.collection('users').insertOne(newUser);

                    user = {
                        _id: result.insertedId,
                        ...newUser
                        };
                }

                const appToken = jwt.sign(
                    {id: user._id.toString(), email: user.email, role: user.role},
                    process.env.SECRET_KEY!,
                    { expiresIn: '2h' }
                );

                return {
                    token: appToken,
                    user:{
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    }
                };
            } catch (error: any) {
                console.error("Erro no login do Google:", error);
                throw new Error("Falha ao autenticar com o Google. Tente novamente.");
            }
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

        updateProduct: async (_: any, {id,name, category, price, stock_quantity, ingredients, foto_url }: any, { db, user }: any ) =>{
            if (!user || !['ADMIN','EMPRESA'].includes(user.role)) throw new ForbiddenError("Acesso restrito.");
            const result = await db.collection('products').findOneAndUpdate(
                {_id: new ObjectId(id)},
                {$set: {
                    name,
                    category,
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
            return { ...result, id: result._id.toString()};
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
        },

        openTableSession: async (_ : any, { table_number } : any, { db , user } : any) =>{
            const activeSession = await db.collection('table_sessions').findOne({
                table_number,
                status: { $in: ['OCUPADA','AGUARDANDO_PAGAMENTO']}
            });

            if(activeSession) throw new Error(`A mesa ${table_number} já está ocupada!`);

            const newSession = {
                table_number,
                status: 'OCUPADA',
                orders: [],
                subtotal: 0.0,
                created_by: user.id,
                created_at: new Date().toISOString()
            };

            const result = await db.collection('table_sessions').insertOne(newSession);
            return { _id: new ObjectId(result.insertId), ...newSession};
        },

        addItemToTable: async(_ : any, { table_number, items } : any , { db, user} : any) =>{
            if(!user || (user.role !== 'ATENDENTE' && user.role !== 'EMPRESA' && user.role !== 'ADMIN')){
                throw new Error('Acesso negado: Apenas atendentes autorizados podem lançar pedidos');
            }

            const tableExists = await db.collection('tables').findOne({ number: table_number});
            if(!tableExists){
                throw new Error(`A Mesa ${table_number} não está cadastrada no sistema`);
            }

            let session = await db.collection('table_sessions').findOne({
                table_number,
                status: 'OCUPADA'
            });

            if(!session){
                const newSession = {
                    table_number,
                    status: 'OCUPADA',
                    orders: [],
                    subtotal: 0.0,
                    created_by: user.id,
                    created_at: new Date().toISOString()
                };
                const res = await db.collection('table_sessions').insertOne(newSession);
                session = { _id: res.insertedId, ...newSession};

                await db.collection('tables').updateOne(
                    {number: table_number},
                    { $set: { status: 'OCUPADA' }}
                );
            }

            const productObjectIds = items.map((i: { product_id: any; }) => new ObjectId(i.product_id));
            const products = await db.collection('products').find({ _id: { $in: productObjectIds}}).toArray();

            let orderTotal = 0;
            const orderItems = items.map((item: { product_id: any; quantity: number; }) => {
                const product = products.find((p : { _id: { toString: () => any; }; }) => p?._id?.toString() === item.product_id);

                if(!product){
                    throw new Error(`Produto não encontado no banco para o ID: ${item.product_id}`);
                }

                const itemTotal = product.price * item.quantity;
                orderTotal += itemTotal;

                return {
                    product_id: product._id,
                    name: product.name,
                    quantity: item.quantity,
                    price: product.price
                };
            });
             
            const mesaId = await db.collection('tables').findOne({ number : table_number});

            const newOrder = {
                id: new Date().getTime().toString(),
                client_id: new ObjectId(mesaId._id),
                items: orderItems,
                total: orderTotal,
                status: "PENDING",
                created_by: new ObjectId(user._id),
                created_at: new Date().toISOString()
            };

            const newSubtotal = (session.subtotal || 0) + orderTotal;

            // 7. PERSISTÊNCIA NO BANCO (Update no MongoDB)
            // Garanta o filtro usando new ObjectId(session._id)
            const targetSessionId = typeof session._id === 'string' ? new ObjectId(session._id) : session._id;

            const updateResult = await db.collection('table_sessions').updateOne(
                { _id: targetSessionId },
                {
                $push: { orders: newOrder } as any,
                $set: { subtotal: newSubtotal }
                }
            );

            // 8. Busca a sessão atualizada para retornar ao GraphQL
            const updatedSession = await db.collection('table_sessions').findOne({ _id: targetSessionId });

            if (!updatedSession) {
                throw new Error("Erro ao carregar os dados atualizados da sessão.");
            }

            
            // 1. Verificação de Estoque Atômica
            for (const item of items) {
                const product = await db.collection('products').findOne({ _id: new ObjectId(item.product_id) });
                if(!product || product.stock_quantity < item.quantity) {
                    throw new Error(`Estoque insuficeinte do item: ${product?.name || 'Desconhecido'}`);
                }  
            }

            // 2. Transação de Débito de Estoque
            for (const item of items) {
                await db.collection('products').updateOne(
                    { _id: new ObjectId(item.product_id) },
                    { $inc: { stock_quantity: -item.quantity } }
                );
            }


            return {
                ...updatedSession,
                id: updatedSession._id.toString()
            };
        },  

        // Fechar a mesa e Gerar a Pré-Nota de Conferência
        closeTableSession: async (_ : any, {table_number} : any, {db, user} : any) =>{
            const session = await db.collection('table_sessions').findOne({
                table_number,
                status: { $in: ['OCUPADA','AGUARDANDO_PAGAMENTO']}
            });

            if(!session) throw new Error(`Nenhuma conta aberta para a mesa ${table_number}`);

            // Agrupa todos os itens repetidos de vários pedidos em um resumo único para a nota
            const summaryMap : Record<string, any> = {};;
            session.orders.forEach((order: { items: any[]; }) => {
                order.items.forEach( item =>{
                    if (!summaryMap[item.name]){
                        summaryMap[item.name] = {
                            name: item.name,
                            total_quantity: 0,
                            unit_price: item.price,
                            total_price: 0
                        };
                    }
                    summaryMap[item.name].total_quantity += item.quantity;
                    summaryMap[item.name].total_price += item.price * item.quantity;
                });
            });

            const itemsSummary = Object.values(summaryMap);
            const closedAt = new Date().toString();
            const closedBy = user.id;

            await db.collection('table_sessions').updateOne(
                {_id: session._id},
                {
                    $set:{
                        status: 'ENCERRADA',
                        closed_at: closedAt,
                        closed_by: closedBy
                    }
                }
            );

            await db.collection('tables').updateOne(
                { number: table_number },
                { $set: { status: 'LIVRE' } }
            );

            return {
                table_number,
                items_summary: itemsSummary,
                total_amount: session.subtotal,
                closed_at: closedAt
            };
        },

        createTable: async (_ :any, { number, capacity } : any, { db, user } :any) => {
            const exists = await db.collection('tables').findOne({ number });
            if (exists) throw new Error(`A mesa ${number} já está cadastrada!`);

            const newTable = {
                number,
                capacity: capacity || 4,
                status: 'LIVRE',
                created_at: new Date().toISOString()
            };

            const result = await db.collection('tables').insertOne(newTable);
            return { id: result.insertedId, ...newTable };
            },

        deleteTable: async (_ : any, { number } : any, { db,user } : any) => {
            const result = await db.collection('tables').deleteOne({ number });
            return result.deletedCount > 0;
        }

    },
    Product: {
        id: (parent: { _id: any }) => parent._id
    },
};
