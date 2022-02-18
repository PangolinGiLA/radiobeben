import { createConnection, getRepository } from "typeorm";
import { User } from "../entity/User";
import * as bcrypt from "bcrypt";

function login(username: string, password: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        let userTable = getRepository(User);
        userTable.findOne({ login: username }).then(user => {
            if (user) {
                bcrypt.compare(password, user.pass).then(result => {
                    if (result)
                        resolve(user.id);
                    else
                        reject("wrong password");
                });
            }
            else {
                reject("user not found");
            }
        });

    })
}
function register(username: string, password: string, permission?: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let userTable = getRepository(User);
        userTable.findOne({ login: username }).then(user => {
            if (user)
                reject("username not available");
            else {
                bcrypt.hash(password, 10).then(hashed => {
                    let permissions = permission ? permission : 63;
                    let user = userTable.create({ login: username, pass: hashed, permissions: permissions });
                    userTable.insert(user).then(result => {
                        resolve("done");
                    })

                });
            }

        });
    });
}

function change_password(userid: number, curr_password: string, new_password: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let userTable = getRepository(User);
        userTable.findOne(userid).then(async user => {
            if (user) {
                if (await bcrypt.compare(curr_password, user.pass)) {
                    let hashed = await bcrypt.hash(new_password, 10);
                    await userTable.update(user.id, { pass: hashed });
                    resolve("done");
                } else {
                    reject("Złe hasło!");
                }
            } else {
                reject("user not found"); // should not happen, as userid is checked in middleware
            }
        });
    });
}

function delete_user(id: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let userTable = getRepository(User);
        userTable.delete(id).then(result => {
            resolve("done");
        });
    });
}

function change_permission(id: number, permission: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let userTable = getRepository(User);
        userTable.update(id, { permissions: permission }).then(result => {
            resolve("done");
        });
    });
}

function change_username(id: number, username: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let userTable = getRepository(User);
        userTable.update(id, { login: username }).then(result => {
            resolve("done");
        });
    });
}

function get_users(id: number): Promise<User[]> {
    return getRepository(User).find();
}

export { login, register, change_password };