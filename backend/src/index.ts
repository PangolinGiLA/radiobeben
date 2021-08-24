import * as express from "express";
import * as session from "express-session"
import { createConnection, getRepository } from "typeorm";
import { api } from "./app";
import { register } from "./app/users";
import { Schedule } from "./entity/Schedule";
import { User } from "./entity/User";

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

createConnection()
  .then(async () => {
    // do some initial setup
    // is any user in db?
    let userTable = getRepository(User);
    if (await userTable.count() === 0) {
      // insert admin user
      await register("admin", "admin", 127); // insert admin user with maximum permissions
    }
    // does schedule table have all week days?
    let scheduleTable = getRepository(Schedule);
    let schedule = await scheduleTable.find();
    let j = 0;
    for (let i = 0; i < 7; i++) {
      if (j < schedule.length) {
        if (schedule[j].weekday > i) {
          scheduleTable.insert({weekday: i, isEnabled: false, breaketime: null, visibility: 2}); // insert missing day
        } else {
          j++;
        }
      }
    }

  });

app.use("/api", api);

app.listen(8080);