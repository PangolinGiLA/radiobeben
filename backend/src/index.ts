import * as express from "express";
import * as session from "express-session"
import { createConnection } from "typeorm";
import { api } from "./app";

var FileStore = require('session-file-store')(session);

const app = express();

declare module 'express-session' {
    interface SessionData {
      userid: number;
    }
}  

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'imamamamamamamalyge',
    store: new FileStore(),
    resave: false,
    saveUninitialized: true
}));

createConnection();

app.use("/api", api);

app.listen(3000);