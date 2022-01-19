import { getRepository, LessThan, Like, MoreThan } from "typeorm";
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
                "Song already exists"
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
                    resolve("added to download queue");
                })
                .catch(err => {
                    reject("no song found");
                });

        }
    });
}

function add_suggestion(ytid: string): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let songsTable = getRepository(Song);
        if (await songsTable.findOne({ ytid: ytid })) {
            reject("song already in library");
        } else {
            let suggesionTable = getRepository(Suggestion);
            suggesionTable.findOne({ ytid: ytid }).then(song => {
                if (song) {
                    reject("song already suggested");
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
                reject("no such author");
            }
        } else if (typeof author === "string") {
            new_author.displayName = author;
            await authorTable.save(new_author);
            resolve(new_author);
        } else {
            reject("invalid author");
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
                reject("song already in library");
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
                    resolve("added to download queue");
                } else {
                    reject("suggestion already accepted/rejected");
                }
            }
        } else {
            reject("no suggestion with that id");
        }

    });
}

function reject_suggestion(id: number): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let suggesionTable = getRepository(Suggestion);
        let suggestion = await suggesionTable.findOne(id);
        if (suggestion) {
            if (suggestion.status != 0) {
                reject("suggestion already accepted/rejected");
            } else {
                await suggesionTable.update(id, { status: -1 });
                resolve("done");
            }
        } else {
            reject("no such suggestion!");
        }

    });
}

function get_suggestions(limit: number, before: number, accepted: boolean, rejected: boolean, waiting: boolean): Promise<Suggestion[]> {
    let where = [];
    if (accepted) where.push({ status: 1, id: LessThan(before != -1 ? before : 100000000) });
    if (rejected) where.push({ status: -1, id: LessThan(before != -1 ? before : 100000000) });
    if (waiting) where.push({ status: 0, id: LessThan(before != -1 ? before : 100000000) });
    if (where.length === 0) {
        // just return promise to empty array
        return new Promise<Suggestion[]>((resolve) => {
            resolve([]);
        });
    } else {
        return getRepository(Suggestion).find({ where: where, order: { id: "DESC" }, take: limit });
    }
}

interface SongUpdate {
    author?: Author,
    name?: string,
    isPrivate?: boolean
}

function update_song(id: number, author?: string | number, name?: string, isPrivate?: boolean): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let song: SongUpdate;
        if (author) {
            try {
                song.author = await find_add_author(author);
            }
            catch (err) {
                reject(err);
            }
        }
        if (name)
            song.name = name;
        if (isPrivate)
            song.isPrivate = isPrivate;
        let songTable = getRepository(Song);
        songTable.update(id, song);
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

function get_songs(userid: number, limit: number, before: number, like: string): Promise<Song[]> {
    return new Promise<Song[]>(async (resolve) => {
        let songTable = getRepository(Song);
        if (userid && await can(userid, permissions.library)) {
            resolve(await songTable.find({ where: [{ author: Like(`%${like}%`) }, { title: Like(`%${like}%`) }], skip: before, take: limit }));
        } else {
            resolve(await songTable.find({ where: [{ isPrivate: false, author: Like(`%${like}%`) }, { isPrivate: false, title: Like(`%${like}%`) }], skip: before, take: limit }));
        }
    })
}

function get_authors(limit: number, before: number, like: string): Promise<Author[]> {
    return new Promise<Author[]>(async (resolve) => {
        let authorTable = getRepository(Author);
        resolve(await authorTable.find({ where: [{ displayName: Like(`%${like}%`) }], skip: before, take: limit }));
    })
}

export { add_suggestion, get_suggestions, accept_suggestion, reject_suggestion, get_songs, add_song, get_authors, delete_song }