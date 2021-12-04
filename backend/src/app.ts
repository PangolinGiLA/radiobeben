import * as express from "express";
import { playlist, initialize_player } from "./routes/playlist";
import { songs } from "./routes/songs";
import { users } from "./routes/users";

const router = express.Router();

router.use("/users", users);
router.use("/songs", songs);
router.use("/playlist", playlist);

function connection_done() {
    initialize_player()
}

export {router as api, connection_done};