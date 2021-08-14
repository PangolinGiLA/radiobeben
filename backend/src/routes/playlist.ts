import * as express from "express";
import { Request, Response } from "express";
import { login_middleware, permissions, permission_middleware } from "../app/permissions";
import { add_to_playlist, get_playlist, get_schedule } from "../app/playlist";

const router = express.Router();

declare module 'express-session' {
    interface SessionData {
        userid: number;
    }
}

router.get("/playlist", async function (req: Request, res: Response) {
    if (req.query.date)
        res.send(await get_playlist(new Date(req.query.date as string), req.session.userid));
    else
        res.sendStatus(400);
});

router.post("/playlist", async function (req: Request, res: Response) {
    if (req.body.date && ( req.body.breaknumber !== undefined ) && req.body.songid) {
        await add_to_playlist(new Date(req.body.date), req.body.breaknumber, req.body.songid, req.session.userid);
        res.sendStatus(200);
    }
    else
        res.sendStatus(400);
});

router.get("/schedule", async function (req: Request, res: Response) {
    if (req.query.date)
        res.send(await get_schedule(new Date(req.query.date as string)));
    else
        res.sendStatus(400);
});

export { router as playlist }