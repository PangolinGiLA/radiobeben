import { Brackets, getRepository, LessThan, Like, MoreThan } from "typeorm";
import { Suggestion } from "../entity/Suggestion";
import * as yts from "yt-search"
import { Song } from "../entity/Song";
import { SongManager } from "../player/songs";
import { can, permissions } from "./permissions";
import { Author } from "../entity/Author";

var songManager = new SongManager;

function add_song(ytid: string, author?: string | number, name?: string, isPrivate?: boolean): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let songTable = getRepository(Song);
        if (await songTable.findOne({ ytid: ytid })) {
            reject(
                "Piosenka już jest w bibliotece!"
            );
        } else {
            let song = new Song;
            song.ytid = ytid;
            yts({ videoId: ytid })
                .then(async songyt => {
                    song.title = (name) ? name : songyt.title;
                    try {
                        song.author = author ? await find_add_author(author) : await find_add_author(songyt.author.name);
                    }
                    catch (err) {
                        reject(err);
                    }
                    song.isPrivate = (isPrivate) ? isPrivate : false;
                    song.duration = songyt.seconds;
                    songManager.DownloadQueue(ytid).then(async new_name => {
                        song.filename = new_name;
                        songTable.insert(song);
                    })
                        .catch(err => {
                            reject(err);
                        });
                    // if song was suggested, set status to accepted
                    let suggestionTable = getRepository(Suggestion);
                    let suggestion = await suggestionTable.findOne({ ytid: ytid });
                    if (suggestion) {
                        await suggestionTable.update(suggestion.id, { status: 1 });
                    }
                    resolve("Dodano piosenkę!");
                })
                .catch(err => {
                    reject("Nie znaleziono piosenki!");
                });

        }
    });
}

function add_suggestion(ytid: string): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let songsTable = getRepository(Song);
        if (await songsTable.findOne({ ytid: ytid })) {
            reject("Piosenka już jest w bibliotece!");
        } else {
            let suggesionTable = getRepository(Suggestion);
            suggesionTable.findOne({ ytid: ytid }).then(song => {
                if (song) {
                    reject("Piosenka już jest sugerowana!");
                } else {
                    yts({ videoId: ytid })
                        .then(async song => {
                            await suggesionTable.insert({ ytid: ytid, name: song.title, author: song.author.name, duration: song.seconds, views: song.views });
                            resolve("done");
                        })
                        .catch(err => {
                            reject(err);
                        })
                }
            });
        }
    });
}

function find_add_author(author: string | number): Promise<Author> {
    return new Promise<Author>(async (resolve, reject) => {
        let authorTable = getRepository(Author);
        let new_author = new Author;
        if (typeof author === "number") {
            new_author = await authorTable.findOne(author);
            if (author) {
                resolve(new_author);
            } else {
                reject("Nie ma takiego autora");
            }
        } else if (typeof author === "string") {
            let possible_author = await authorTable.findOne({ displayName: author });
            if (possible_author) {
                resolve(possible_author);
            } else {
                new_author.displayName = author;
                await authorTable.save(new_author);
                resolve(new_author);
            }
        } else {
            reject("Niepoprawny autor");
        }
    });
}

function accept_suggestion(id: number, name?: string, author?: string | number): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let suggesionTable = getRepository(Suggestion);
        let to_accept = await suggesionTable.findOne(id);
        if (to_accept) {
            let songsTable = getRepository(Song);
            if (await songsTable.findOne({ ytid: to_accept.ytid })) {
                reject("Piosenka już jest w bibliotece!");
            } else {
                if (to_accept.status == 0) {
                    songManager.DownloadQueue(to_accept.ytid).then(async new_name => {
                        let songTable = getRepository(Song);
                        let song = new Song;
                        song.title = (name) ? name : to_accept.name;
                        try {
                            song.author = await find_add_author(author);
                        }
                        catch (err) {
                            reject(err);
                        }
                        song.duration = to_accept.duration;
                        song.filename = new_name;
                        song.ytid = to_accept.ytid;
                        songTable.insert(song);
                    })
                        .catch(err => {
                            reject(err);
                        });
                    suggesionTable.update(id, { status: 1 });
                    resolve("Piosenka została dodana!");
                } else {
                    reject("Sugestia już była rozpatrzona!");
                }
            }
        } else {
            reject("Nie ma takiej sugestii!");
        }

    });
}

function reject_suggestion(id: number): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let suggesionTable = getRepository(Suggestion);
        let suggestion = await suggesionTable.findOne(id);
        if (suggestion) {
            if (suggestion.status != 0) {
                reject("Sugestia już była rozpatrzona");
            } else {
                await suggesionTable.update(id, { status: -1 });
                resolve("done");
            }
        } else {
            reject("Nie ma takiej sugestii!");
        }

    });
}

function get_suggestions(limit: number, before: number, accepted: boolean, rejected: boolean, waiting: boolean): Promise<Suggestion[]> {
    let where = [];
    if (accepted) where.push({ status: 1, id: LessThan(before != -1 ? before : 100000000) });
    if (rejected) where.push({ status: -1, id: LessThan(before != -1 ? before : 100000000) });
    if (waiting) where.push({ status: 0, id: LessThan(before != -1 ? before : 100000000) });
    if (where.length === 0) {
        // show all
        where.push({ status: 1, id: LessThan(before != -1 ? before : 100000000) });
        where.push({ status: -1, id: LessThan(before != -1 ? before : 100000000) });
        where.push({ status: 0, id: LessThan(before != -1 ? before : 100000000) });
    }

    return getRepository(Suggestion).find({ where: where, order: { id: "DESC" }, take: limit });
}

function update_song(id: number, author?: string, name?: string, isPrivate?: boolean, globalAuthor?: boolean): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let songTable = getRepository(Song);
        let song = await songTable.findOne(id);
        let oldauthor2 = song.author;
        let changed = false;
        if (song) {
            if (author !== song.author.displayName) {
                if (author && globalAuthor) {
                    let authorTable = getRepository(Author);
                    let newauthor = await authorTable.findOne({ displayName: author });
                    if (newauthor) {
                        let oldauthor = song.author;
                        song.author = newauthor;
                        await songTable.update({ author: oldauthor }, { author: newauthor });
                        await authorTable.remove(oldauthor);
                    } else {
                        song.author.displayName = author;
                        await authorTable.save(song.author);
                    }
                } else {
                    if (author) {
                        try {
                            song.author = await find_add_author(author);
                            changed = true;
                        }
                        catch (err) {
                            reject(err);
                        }
                    }
                }
            }
            if (name)
                song.title = name;
            if (isPrivate)
                song.isPrivate = isPrivate;

            await songTable.save(song);
            if (changed) {
                if ((await songTable.find({ author: oldauthor2 })).length === 0) {
                    let authorTable = getRepository(Author);
                    await authorTable.remove(oldauthor2);
                }
            }
            resolve("done");
        } else {
            reject("Nie ma takiej piosenki!");
        }
    });
}

function delete_song(id: number): Promise<string> {
    return new Promise<string>(async resolve => {
        let songTable = getRepository(Song);
        let song = await songTable.findOne(id);
        await songManager.RemoveSong(song.filename);
        await songTable.delete(id);
        resolve("done");
    });

}

interface OrderOption {
    "author.displayName"?: "ASC" | "DESC";
    "song.id"?: "ASC" | "DESC";
    "song.ytid"?: "ASC" | "DESC";
    "song.title"?: "ASC" | "DESC";
    "song.filename"?: "ASC" | "DESC";
    "song.duration"?: "ASC" | "DESC";
}

interface OrderOptionObject {
    [key: string]: OrderOption
}

const sorting: OrderOptionObject = {
    "aa": { "author.displayName": "ASC" },
    "ad": { "author.displayName": "DESC" },
    "da": { "song.duration": "ASC" },
    "dd": { "song.duration": "DESC" },
    "ia": { "song.id": "ASC" },
    "id": { "song.id": "DESC" },
    "ta": { "song.title": "ASC" },
    "td": { "song.title": "DESC" }
}

function get_songs(userid: number, limit: number, before: number, like: string, order?: string): Promise<Song[]> {
    return new Promise<Song[]>(async (resolve) => {
        let songTable = getRepository(Song);
        let orederobjet = sorting["ta"];

        if (order && order in sorting) {
            orederobjet = sorting[order];
        }

        if (userid && await can(userid, permissions.library)) {
            //resolve(await songTable.find({ where: [{ author: { displayName: Like(`%${like}%`) } }, { title: Like(`%${like}%`) }], skip: before, take: limit, order: orederobjet, relations: ["author"] }));
            resolve(await songTable.createQueryBuilder('song')
                .leftJoinAndSelect("song.author", "author")
                .where("author.displayName LIKE :displayName", { displayName: `%${like}%` })
                .orWhere("song.title LIKE :title", { title: `%${like}%` })
                .orderBy(Object.keys(orederobjet)[0], Object.values(orederobjet)[0])
                .take(limit)
                .skip(before)
                .getMany())

        } else {
            //resolve(await songTable.find({ where: [{ isPrivate: false, author: { displayName: Like(`%${like}%`) } }, { isPrivate: false, title: Like(`%${like}%`) }], skip: before, order:orederobjet, take: limit, relations: ["author"] }));
            resolve(await songTable.createQueryBuilder('song')
                .leftJoinAndSelect("song.author", "author")
                .where("song.isPrivate = :private", { private: false })
                .andWhere(new Brackets(qb => {
                    qb.where("author.displayName LIKE :displayName", { displayName: `%${like}%` })
                        .orWhere("song.title LIKE :title", { title: `%${like}%` })
                }))
                .orderBy(Object.keys(orederobjet)[0], Object.values(orederobjet)[0])
                .take(limit)
                .skip(before)
                .getMany()
            )
        }
    })
}

function get_authors(limit: number, before: number, like: string): Promise<Author[]> {
    return new Promise<Author[]>(async (resolve) => {
        let authorTable = getRepository(Author);
        resolve(await authorTable.find({ where: [{ displayName: Like(`%${like}%`) }], skip: before, take: limit }));
    })
}

export { add_suggestion, get_suggestions, accept_suggestion, reject_suggestion, get_songs, add_song, get_authors, delete_song, update_song };