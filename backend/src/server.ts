import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import path from 'path';

const MONGO_URI = process.env.MONGO_URI!;
const SECRET_KEY = process.env.SECRET_KEY!;
const PORT = process.env.PORT || 4000;

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

  // 1. Conexão com o MongoDB
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  console.log("🍃 MongoDB conectado com sucesso!");

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ','');
      let user = null;
      
      if (token ) {
        try {

          const user = jwt.verify(token,SECRET_KEY);
          return { db, user };
        } catch (err) {
          console.log('Token inválido');
        }
      }
      return { db, user}
    }
  });

  await server.start();
  server.applyMiddleware({ app:app as any, path: '/graphql'});
  
  app.listen(PORT, () =>{
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}${server.graphqlPath}`);
  })
}

startServer().catch(err => console.error('Error ao iniciar servidor', err) );