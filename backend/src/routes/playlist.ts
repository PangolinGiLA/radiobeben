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
    res.send(await get_playlist(new Date())); // just for testing
    /*
    if (req.body.date)
        res.send(get_playlist(req.body.date, req.session.userid));
    else
        res.sendStatus(400);
    */
});

router.post("/playlist", function (req: Request, res: Response) {
    if (req.body.date && req.body.breaknumber && req.body.songid)
        add_to_playlist(req.body.date, req.body.breaknumber, req.body.songid, req.session.userid);
    else
        res.sendStatus(400);
});

router.get("/schedule", async function (req: Request, res: Response) {
    res.send(await get_schedule(new Date()));
    /*
    if (req.body.date)
        res.send(get_schedule(req.body.date));
    else
        res.sendStatus(400);
    */
});

export { router as playlist }