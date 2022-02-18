import * as express from "express";
import { Request, Response } from "express";
import { change_password, login, register } from "../app/users";
import { get_permissions, login_middleware, permissions, permission_middleware } from "../app/permissions";

const router = express.Router();


declare module 'express-session' {
    interface SessionData {
        userid: number;
    }
}

router.post("/login", function (req: Request, res: Response) {
    if (!req.session.userid) {
        if (req.body.login && req.body.password) {
            login(req.body.login, req.body.password)
                .then(id => {
                    req.session.userid = id;
                    res.status(200).send("logged in");
                })
                .catch(err => {
                    res.status(403).send(err);
                });
        } else {
            res.sendStatus(400);
        }
    } else {
        res.status(403).send("already logged in");
    }
});

router.put("/password", login_middleware, function (req: Request, res: Response) {
    if (req.body.old_password && req.body.new_password) {
        change_password(req.session.userid, req.body.old_password, req.body.new_password)
            .then(result => {
                res.sendStatus(200);
            })
            .catch(err => {
                res.status(400).send(err);
            });
    } else {
        res.sendStatus(400);
    }
});

router.use(login_middleware);

router.post("/register", login_middleware, permission_middleware(permissions.users), function (req: Request, res: Response) {
    if (req.body.login && req.body.password && req.body.permissions) {
        if ((req.body.login as string).length >= 3 && (req.body.password as string).length > 8) {
        register(req.body.login, req.body.password, req.body.permissions)
            .then(result => {
                console.log(result);
                res.sendStatus(200);
            })
            .catch(err => {
                console.log(err);
                res.sendStatus(400);
            })
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(400);
    }
});

router.get("/logout", function (req: Request, res: Response) {
    req.session.destroy(function (err) {
        res.sendStatus(200);
    });
});

router.get("/permissions", async function(req: Request, res: Response) {
    if (req.session.userid) {
        let user_permissions = await get_permissions(req.session.userid);
        res.status(200).send({permissions: user_permissions});
    } else {
        // not logged in
        res.sendStatus(401);
    }
});

export { router as users };