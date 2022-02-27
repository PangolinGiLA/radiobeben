import * as express from "express";
import { Request, Response } from "express";
import { login_middleware, permissions, permission_middleware } from "../app/permissions";
import { add_preset, add_to_playlist, get_default_schedule, get_playlist, get_presets, get_schedule, remove_from_playlist, reset_day_schedule, set_day_schedule, set_weekday } from "../app/playlist";
import { Break } from "../types/Time";
import player from "../player/player";
import { getRepository } from "typeorm";
import { Song } from "../entity/Song";

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
    if (req.body.date && (req.body.breaknumber !== undefined) && req.body.songid) {
        try {
            await add_to_playlist(new Date(req.body.date), req.body.breaknumber, req.body.songid, req.session.userid);
            res.sendStatus(200);
        } catch (e) {
            res.status(402).send({error:e});
        }
    }
    else
        res.sendStatus(400);
});

router.delete("/playlist", login_middleware, permission_middleware(permissions.playlist), function (req: Request, res: Response) {
    if (req.body.id) {
        remove_from_playlist(req.body.id)
            .then(r => {
                res.sendStatus(200);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    }
    else
        res.sendStatus(400);
})

router.get("/schedule", async function (req: Request, res: Response) {
    if (req.query.date)
        res.send(await get_schedule(new Date(req.query.date as string), req.session.userid));
    else
        res.sendStatus(400);
});

router.get("/weekdays", async function (req: Request, res: Response) {
    res.send(await get_default_schedule());
});

router.put("/schedule", login_middleware, permission_middleware(permissions.schedule), async function (req: Request, res: Response) {
    if (req.body.weekday !== undefined && req.body.isEnabled !== undefined && req.body.isEnabled === false) {
        set_weekday(req.body.weekday, req.body.isEnabled)
            .then(() => {
                res.sendStatus(200);
            })
            .catch(err => {
                res.status(400).send(err);
            })
    } else {
        if (req.body.weekday !== undefined && req.body.isEnabled !== undefined && req.body.breaktimeid !== undefined && req.body.visibility !== undefined) {
            set_weekday(req.body.weekday, req.body.isEnabled, req.body.breaktimeid, req.body.visibility)
            .then(() => {
                res.sendStatus(200);
            })
            .catch( err => {
                res.status(400).send(err);
            });
        } else {
            res.sendStatus(400);
        }
    }
});

router.get("/breaktimes", login_middleware, permission_middleware(permissions.schedule), async function (req: Request, res: Response) {
    res.send(await get_presets());
});

router.post("/breaktimes", login_middleware, permission_middleware(permissions.schedule), async function (req: Request, res: Response) {
    if (req.body.breaktimes && req.body.name) {
        await add_preset(req.body.name, req.body.breaktimes);
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
});

let player_instance: player;

function initialize_player() {
    player_instance = player.Instance;
}

router.put("/amp", login_middleware, permission_middleware(permissions.amp), async function (req: Request, res: Response) {
    if (req.body.mode !== undefined) {
        player_instance.set_amp_mode(req.body.mode);
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
});

router.get("/amp", login_middleware, permission_middleware(permissions.amp), async function (req: Request, res: Response) {
    res.send({mode: player_instance.get_amp_mode()});
});

router.get("/playing", function (req: Request, res: Response) {
    if (player_instance)
        res.send({playing: player_instance.playing, what: player_instance.song, progress: player_instance.song_progress});
    else
        res.sendStatus(500);
}); 

router.put("/play", login_middleware, permission_middleware(permissions.playlist), async function (req: Request, res: Response) {
    if (req.body.id) {
        let song = await getRepository(Song).findOne(req.body.id);
        if (song) {
            player_instance.play(song, false);
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(400);
    }
});

router.get("/stop", login_middleware, permission_middleware(permissions.playlist), async function (req: Request, res: Response) {
    player_instance.stop();
    res.sendStatus(200);
});

router.delete("/day", login_middleware, permission_middleware(permissions.schedule), async function (req: Request, res: Response) {
    if (req.body.date) {
        reset_day_schedule(req.body.date)
        .then(() => {
            res.sendStatus(200);
        })
        .catch(err => {
            res.status(400).send(err);
        });
    } else {
        res.sendStatus(400);
    }
});

router.put("/day", login_middleware, permission_middleware(permissions.schedule), async function (req: Request, res: Response) {
    if (req.body.day && req.body.breaktimeid && req.body.visibility && req.body.isEnabled) {
        await set_day_schedule(req.body.day, req.body.breaktimeid, req.body.isEnabled, req.body.visibility);
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
});

export { router as playlist, initialize_player };