import * as express from "express";
import { Request, Response } from "express";
import { login_middleware, permissions, permission_middleware } from "../app/permissions";
import { accept_suggestion, add_suggestion, get_suggestions, reject_suggestion } from "../app/songs";

const router = express.Router();

router.post("/suggestions", function (req: Request, res: Response) {
    if (req.body.ytid) {
        add_suggestion(req.body.ytid)
            .then(result => {
                res.sendStatus(200);
            })
            .catch(err => {
                res.status(404).send(err);
            })
    } else {
        res.sendStatus(400);
    }
});

router.get("/suggestions", function (req: Request, res: Response) {
    get_suggestions().then(result => {
        res.send(result);
        // in future add limit and before options
    });
});

router.put("/suggestions", login_middleware, permission_middleware(permissions.suggestions), function (req: Request, res: Response) {
    if (req.body.status && req.body.id) {
        if (req.body.status == 1) {
            accept_suggestion(req.body.id, req.body.name, req.body.author)
                .then(result => {
                    res.send(result);
                })
                .catch(err => {
                    res.status(404).send(err);
                });
        } else if (req.body.status == -1) {
            reject_suggestion(req.body.id)
                .then(result => {
                    res.send(result);
                })
                .catch(err => {
                    res.status(404).send(err);
                });
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(400);
    }
});

export { router as songs }