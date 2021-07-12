import * as express from "express";
import { users } from "./routes/users";

const router = express.Router();

router.use("/users", users);

export {router as api};