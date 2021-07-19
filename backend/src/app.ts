import * as express from "express";
import { songs } from "./routes/songs";
import { users } from "./routes/users";

const router = express.Router();

router.use("/users", users);
router.use("/songs", songs);
export {router as api};