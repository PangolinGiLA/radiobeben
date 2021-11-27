/*
    PERMISSIONS
    - suggestions (accept / decline)
    - playlist (add / remove songs)
    - schedule (change working hours and privacy)
    - amp (change mode - on / auto / off)
    - library (remove and edit songs)
    - users (add / remove users and manage thei permissions)
    Stored as number from 0 to 2^5 - 1
    in which each bit represents if user
    has certain permission or not

*/

import { getRepository } from "typeorm";
import { User } from "../entity/User";
import { Request, Response } from "express"

declare module 'express-session' {
    interface SessionData {
        userid: number;
    }
}

export enum permissions {
    suggestions,
    playlist,
    schedule,
    amp,
    library,
    users
}

export function get_permissions(userid: number): Promise<number> {
    return new Promise<number>((resolve) => {
        const userTable = getRepository(User);
        userTable.findOne({ id: userid }).then(user => {
            resolve(user.permissions);
        });
    });
}

function get_nth_bite(n: number, number: number): boolean {
    return Boolean(number & (1 << n));
}

export function can(userid: number, what: permissions): Promise<boolean> {
    return new Promise<boolean>(resolve => {
        get_permissions(userid).then(user_permissions => {
            resolve(get_nth_bite(what, user_permissions));
        })
    });
}

export function permission_middleware(what: permissions) {
    return function (req: Request, res: Response, next) {
        can(req.session.userid, what).then(permitted => {
            if (permitted) {
                next();
            }
            else {
                res.sendStatus(403);
            }
        });
    }
}


export function login_middleware(req: Request, res: Response, next) {
    if (req.session.userid) {
        next();
    } else {
        res.sendStatus(401);
    }
}