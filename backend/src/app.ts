import * as express from "express";
import { playlist } from "./routes/playlist";
import { songs } from "./routes/songs";
import { users } from "./routes/users";

const router = express.Router();

router.use("/users", users);
router.use("/songs", songs);
router.use("/playlist", playlist);
export {router as api};