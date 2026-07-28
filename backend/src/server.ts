import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import path, { dirname } from 'node:path';

const mongoUser = process.env.MONGO_WEB_USER!;
const mongoPassword = process.env.MONGO_WEB_PASSWORD!;

const username = encodeURIComponent(mongoUser);
const password = encodeURIComponent(mongoPassword);
const cluster = process.env.MONGO_WEB_CLUSTER!;
const appName = process.env.MONGO_WEB_APPNAME!;

const MONGO_URI = `mongodb+srv://${username}:${password}@${cluster}.ym8yvxt.mongodb.net/?appName=${appName}`;
const SECRET_KEY = process.env.SECRET_KEY!;
const PORT = process.env.PORT || 4000;

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname,'..','public', 'uploads')));
  app.use(express.static(path.join(__dirname,"../../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname,"../../frontend/dist/index.html"));
  });

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