import { Between, getManager, getRepository, MoreThan, MoreThanOrEqual } from "typeorm";
import { Breaketimes } from "../entity/Breaketimes";
import { Days } from "../entity/Days";
import { Playlist } from "../entity/Playlist";
import { Break } from "../types/Time";
import { Schedule } from "../entity/Schedule"
import { Song } from "../entity/Song";
import { can, permissions } from "./permissions";
import { cfg } from "../config/general";
import { DayInfo } from "../types/DayInfo";
import {secondsToHMS, jsDatetoSQLDate, getMonday, SQLdate, SQLtime, SQLdatetime, setHMS} from "./datetime"
function get_playlist(date: Date, userid?: number): Promise<Playlist[]> {
    return new Promise<Playlist[]>(async (resolve, reject) => {
        let daysTable = getRepository(Days);
        let day = await daysTable.findOne(
            { date: jsDatetoSQLDate(date) },
            { relations: ["playlist", "playlist.song"] }
        );
        let dayInfo = await get_day_info(date);
        if ((dayInfo.visibility !== 0) || (userid && await can(userid, permissions.playlist))) {
            if (day)
                resolve(day.playlist);
            else
                resolve([]);
        } else {
            reject("not permitted");
        }
    });
}

// this function is a monster
// i am sorry for that
function add_to_playlist(day: Date, breaknumber: number, songid: number, userid?: number): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        // get date from Date
        let date = jsDatetoSQLDate(day);

        // get schedule for that day (will be used soon)
        let schedule = await get_schedule(day);

        // check if song exists
        let songTable = getRepository(Song);
        let song = await songTable.findOne(songid);
        if (!song) {
            // no such song
            reject("Nie ma takiej piosenki!");
            return;
        }

        let playlistTable = getRepository(Playlist);

        // first 
        // is date in future
        if (jsDatetoSQLDate(day) < jsDatetoSQLDate(new Date())) {
            reject("Nie możesz dodawać piosenek w przeszłości!");
            return;
        }

        // break exists
        if (breaknumber >= schedule.length) {
            reject("Przerwa nie istnieje!");
            return;
        }

        // has higher permissions
        let permitted = (userid && await can(userid, permissions.playlist))

        let song_end: Date; // preciding song end

        let if_return = false;
        // check if day exists in Days table
        await get_day(date)
            .then(async that_day => {
                // exists

                // is the break full
                let last_song = await playlistTable.findOne(
                    { breakNumber: breaknumber, day: that_day },
                    { order: { estTime: "DESC" }, relations: ["song"] }
                );
                if (last_song) {
                    // calculate song end ( song end will be usefull later too )
                    song_end = last_song.estTime;
                    song_end.setSeconds(last_song.estTime.getSeconds() + last_song.song.duration);
                    // calculate break end
                    let break_end = setHMS(day, schedule[breaknumber].end.hour, schedule[breaknumber].end.minutes, 0);
                    // if last song ends later than break, break is full
                    if (song_end.getTime() >= break_end.getTime()) {
                        reject("Przerwa jest pełna!");
                        if_return = true;
                        return;
                    }
                } else {
                    // break is empty
                    // just calculate new song start
                    let break_start = setHMS(day, schedule[breaknumber].start.hour, schedule[breaknumber].start.minutes, 0);
                    song_end = break_start;
                }
                // more things to check
                // if permitted, can skip this
                if (!permitted) {
                    // daily song/author limit if enabled
                    // song
                    if (cfg.daily_limit.song !== null) {
                        if (await playlistTable.count({ day: that_day, song: song }) >= cfg.daily_limit.song) {
                            reject("Przekroczono dzienny limit piosenki!");
                            if_return = true;
                            return;
                        }
                    }
                    // author
                    if (cfg.daily_limit.author !== null) {
                        let authors = await playlistTable.createQueryBuilder("playlist")
                            .leftJoinAndSelect('playlist.song', 'song')
                            .where("song.authorId = :author", { author: song.author.id })
                            .andWhere("playlist.day = :day", { day: that_day.id })
                            .execute();
                        if (authors.length >= cfg.daily_limit.author) {
                            reject("Przekroczono dzienny limit autora!");
                            if_return = true;
                            return;
                        }
                    }
                }
            })
            .catch(() => {
                // day does not exist yet
                // calculate song_end, for parity
                let break_start = setHMS(day, schedule[breaknumber].start.hour, schedule[breaknumber].start.minutes, 0);
                song_end = break_start;
            });
        // stop if rejected somewhere above
        if (if_return)
            return;
        // even more things to check
        if (!permitted) {
            // weekly song/author limit if enabled
            // author
            if (cfg.weekly_limit.author !== null) {
                // when week starts and ends
                let monday = getMonday(day);
                let next_monday = new Date(monday);
                next_monday.setDate(monday.getDate() + 7);
                // crazy query to count
                let authors_week = await playlistTable.createQueryBuilder("playlist")
                    .leftJoinAndSelect('playlist.song', 'song')
                    .leftJoinAndSelect('playlist.day', 'day')
                    .where("song.authorId = :author", { author: song.author.id })
                    .andWhere("day.date >= :monday", { monday: jsDatetoSQLDate(monday) })
                    .andWhere("day.date < :n_monday", { n_monday: jsDatetoSQLDate(next_monday) })
                    .execute();
                // and compare
                if (authors_week.length >= cfg.weekly_limit.author) {
                    reject("Przekroczono tydodniowy limit autora!");
                    return;
                }
            }
            // song
            if (cfg.weekly_limit.song !== null) {
                // when week starts and ends
                let monday = getMonday(day);
                let next_monday = new Date(monday);
                next_monday.setDate(monday.getDate() + 7);
                // crazy query to count
                let songs_week = await playlistTable.createQueryBuilder("playlist")
                    .leftJoinAndSelect('playlist.day', 'day')
                    .where("playlist.song = :song", { song: song.id })
                    .andWhere("day.date >= :monday", { monday: jsDatetoSQLDate(monday) })
                    .andWhere("day.date < :n_monday", { n_monday: jsDatetoSQLDate(next_monday) })
                    .execute();
                // and compare
                if (songs_week.length >= cfg.weekly_limit.song) {
                    reject("Przekroczono tydodniowy limit piosenki!");
                    return;
                }
            }
            // monthly song/author limit if enabled
            // author
            if (cfg.monthly_limit.author !== null) {
                let month_start = new Date(day.getFullYear(), day.getMonth(), 1);
                let next_month_start = new Date(day.getFullYear(), day.getMonth() + 1, 1);
                // crazy query
                let authors_month = await playlistTable.createQueryBuilder("playlist")
                    .leftJoinAndSelect('playlist.song', 'song')
                    .leftJoinAndSelect('playlist.day', 'day')
                    .where("song.authorId = :author", { author: song.author.id })
                    .andWhere("day.date >= :month", { month: jsDatetoSQLDate(month_start) })
                    .andWhere("day.date < :n_month", { n_month: jsDatetoSQLDate(next_month_start) })
                    .execute();

                if (authors_month.length >= cfg.monthly_limit.author) {
                    reject("Przekroczono miesięczny limit autora!");
                    return;
                }
            }
            // song
            if (cfg.monthly_limit.song !== null) {
                let month_start = new Date(day.getFullYear(), day.getMonth(), 1);
                let next_month_start = new Date(day.getFullYear(), day.getMonth() + 1, 1);
                // query
                let songs_month = await playlistTable.createQueryBuilder("playlist")
                    .leftJoinAndSelect('playlist.day', 'day')
                    .where("playlist.song = :song", { song: song.id })
                    .andWhere("day.date >= :month", { month: jsDatetoSQLDate(month_start) })
                    .andWhere("day.date < :n_month", { n_month: jsDatetoSQLDate(next_month_start) })
                    .execute();
                // and compare
                if (songs_month.length >= cfg.monthly_limit.song) {
                    reject("Przekroczono miesięczny limit piosenki!");
                    return;
                }
            }
            // is day private
            let day_info = await get_day_info(day);
            if (day_info.visibility < 2) {
                reject("Nie możesz dodać piosenki do prywatnego dnia!");
                return;
            }
            // is date not too far in future
            if (((song_end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) > cfg.days_in_future) {
                reject("Dzień jest za daleko w przyszłości!");
                return;
            }
            // is song with that id private
            if (song.isPrivate) {
                reject("Piosenka jest prywatna!");
                return;
            }
        }

        // check for hard limit of future days
        if (((song_end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) > 1000) {
            reject("Dzień jest za daleko w przyszłości!");
            return;
        }

        // check if there already is database record for that day
        // if not, create it
        let newday = await create_day(day)
        let playlist = new Playlist();
        playlist.breakNumber = breaknumber;
        playlist.song = song;
        playlist.day = newday;
        playlist.estTime = song_end;
        await playlistTable.save(playlist);
        resolve("done");
    });
}

function fix_break_after_remove(removedSong: Playlist): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let result = await getManager().query(
            "UPDATE playlist SET estTime=SUBTIME(estTime, ?) WHERE breakNumber=? AND dayId=? AND estTime > ?",
            [secondsToHMS(removedSong.song.duration), removedSong.breakNumber, removedSong.day.id, SQLdatetime(removedSong.estTime)]
        );
        resolve("done");
    });
}

function remove_from_playlist(playlistid: number): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let playlistTable = getRepository(Playlist);
        let toRemove = await playlistTable.findOne(playlistid, { relations: ["day", "song"] });
        if (toRemove) {
            playlistTable.delete(playlistid);
            await fix_break_after_remove(toRemove);
            resolve("done");
        } else {
            reject("Nie ma takiej piosenki w playliście!");
        }
    });
}

function get_presets(): Promise<Breaketimes[]> {
    return getRepository(Breaketimes).find({ archived: false });
}

function get_default_schedule(): Promise<Schedule[]> {
    return getRepository(Schedule).find({ relations: ["breaketime"] });
}

function add_preset(name: string, breaktimes: Break[]): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let breaketimesTable = getRepository(Breaketimes);
        await breaketimesTable.insert({ name: name, breaketimesJSON: breaktimes });
        resolve("done");
    });
}

function get_schedule(day: Date, userid?: number): Promise<Break[]> {
    return new Promise<Break[]>(async (resolve, reject) => {
        let info = await get_day_info(day);
        if (info.visibility === 0) {
            if (userid && await can(userid, permissions.playlist)) {
                // just permitted users can see schedule
                if (info.isEnabled)
                    resolve(info.breaketime.breaketimesJSON);
                else
                    resolve([]);
            } else {
                reject("Dzień jest prywatny!");
            }
        } else {
            if (info.isEnabled)
                resolve(info.breaketime.breaketimesJSON);
            else
                resolve([]);
        }
    });
}

function set_weekday(weekday: number, isEnabled: boolean, breaketimeid?: number, visibility?: number): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let scheduleTable = getRepository(Schedule);
        let breaketimesTable = getRepository(Breaketimes);
        let old_schedule = await scheduleTable.findOne({ weekday: weekday }, { relations: ["breaketime"] });
        if (isEnabled) {
            let breaketime = await breaketimesTable.findOne(breaketimeid)
            if (breaketime) {
                await scheduleTable.update(weekday, { isEnabled: true, breaketime: breaketime, visibility: visibility });
                // migrate playlist for future days
                let daysTable = getRepository(Days);
                let daysToMigrate = await daysTable.createQueryBuilder("day")
                    .select()
                    .where("day.date >= CURRENT_DATE()")
                    .andWhere("WEEKDAY(day.date) = :weekday", { weekday: (weekday + 6) % 7 })
                    .andWhere("day.hasDefaultSchedule = TRUE")
                    .execute()
                // ik, should do it with one query but im lazy
                for (let i of daysToMigrate) {
                    let day = await getRepository(Days).findOne(i.day_id);
                    await migrate_day(old_schedule.breaketime.breaketimesJSON, breaketime.breaketimesJSON, day);
                    day.isEnabled = isEnabled;
                    day.breaketime = breaketime;
                    if (visibility)
                        day.visibility = visibility;
                    await daysTable.save(day);
                }
                resolve("done");
            } else {
                reject("no such breaktime");
            }
        } else {
            await scheduleTable.update(weekday, { isEnabled: false });
            resolve("done");
        }
    });
}

function day_exists(date: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
        let daysTable = getRepository(Days);
        let that_day = await daysTable.findOne({ date: date });
        resolve(Boolean(that_day));
    });
}

function get_day(date: string): Promise<Days> {
    return new Promise<Days>(async (resolve, reject) => {
        let daysTable = getRepository(Days);
        let that_day = await daysTable.findOne({ date: date });
        if (that_day) {
            resolve(that_day);
        } else {
            reject();
        }
    });
}

function get_day_info(day: Date): Promise<DayInfo> {
    return new Promise<DayInfo>(async resolve => {
        let date = jsDatetoSQLDate(day)
        if (await day_exists(date)) {
            // get info from Days
            let daysTable = getRepository(Days);
            resolve(await daysTable.findOne({ date: date }, { relations: ["breaketime"] }));
        } else {
            // get info from Schedule
            let scheduleTable = getRepository(Schedule);
            let schedule = await scheduleTable.findOne({ weekday: day.getDay() }, { relations: ["breaketime"] });
            resolve(schedule);
        }
    });
}

function create_day(day: Date): Promise<Days> {
    return new Promise<Days>(resolve => {
        get_day(jsDatetoSQLDate(day))
            .then(that_day => {
                resolve(that_day);
            })
            .catch(async () => {
                // day does not yet exist
                let daysTable = getRepository(Days);
                let newday = new Days()
                let scheduleTable = getRepository(Schedule);
                let schedule = await scheduleTable.findOne({ weekday: day.getDay() }, { relations: ["breaketime"] })
                newday = new Days()
                newday.date = jsDatetoSQLDate(day);
                newday.playlist = [];
                newday.breaketime = schedule.breaketime;
                newday.isEnabled = schedule.isEnabled;
                newday.visibility = schedule.visibility;
                await daysTable.insert(newday);
                resolve(newday);
            })
    });
}

// NOT WORKING IDK WHY TO DEBUG LATER
function migrate_day(old_breaketimes: Break[], new_breaketimes: Break[], day: Days): Promise<string> {
    return new Promise<string>(async resolve => {
        if (old_breaketimes !== new_breaketimes) {
            for (let i = 0; i < old_breaketimes.length; i++) {
                if (new_breaketimes[i]) {
                    // move beginings of the song by time difference
                    let oldtime = new Date(day.date);
                    oldtime = setHMS(oldtime, old_breaketimes[i].start.hour, old_breaketimes[i].start.minutes, 0);
                    let newtime = new Date(day.date);
                    newtime = setHMS(newtime, new_breaketimes[i].start.hour, new_breaketimes[i].start.minutes, 0);
                    let diff = (oldtime.getTime() - newtime.getTime()) / 1000; // time difference in seconds
                    if (diff < 0) {
                        let result = await getManager().query(
                            "UPDATE playlist SET estTime=ADDTIME(estTime, SEC_TO_TIME(?)) WHERE breakNumber=? AND dayId=?",
                            [Math.abs(diff), i, day.id]
                        );
                    } else {
                        let result = await getManager().query(
                            "UPDATE playlist SET estTime=SUBTIME(estTime, SEC_TO_TIME(?)) WHERE breakNumber=? AND dayId=?",
                            [Math.abs(diff), i, day.id]
                        );
                    }

                    // remove songs that start after break end
                    let breakend = new Date(day.date);
                    breakend = setHMS(breakend, new_breaketimes[i].end.hour, new_breaketimes[i].end.minutes, 0);
                    let playlistTable = getRepository(Playlist);
                    await playlistTable.delete({ breakNumber: i, estTime: MoreThanOrEqual(breakend) });
                }
            }
            // remove song from breaks that don't exist now
            if (old_breaketimes.length > new_breaketimes.length) {
                let playlistTable = getRepository(Playlist);
                await playlistTable.delete({ breakNumber: MoreThan(new_breaketimes.length) });
            }
        }
        resolve("done");
    });
}

function reset_day_schedule(date: string): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let scheduleTable = getRepository(Schedule);
        let daysTable = getRepository(Days);
        let day = await daysTable.findOne({ date: date }, {relations: ["breaketime"]});
        if (day) {
            let schedule = await scheduleTable.findOne({ weekday: new Date(day.date).getDay() }, { relations: ["breaketime"] });
            await migrate_day(day.breaketime.breaketimesJSON, schedule.breaketime.breaketimesJSON, day);
            day.isEnabled = schedule.isEnabled;
            day.visibility = schedule.visibility;
            day.breaketime = schedule.breaketime;
            await daysTable.save(day);
            resolve("done");
        } else {
            reject("Nie ma takiego dnia!");
        }
    });
}

function set_day_schedule(date: string, breaketimeid: number, isEnabled: boolean, visibility: number): Promise<string> {
    return new Promise<string>(async resolve => {
        let breaketimeTable = getRepository(Breaketimes);
        let breaketime = await breaketimeTable.findOne(breaketimeid);
        get_day(date).then(async day => {
            day.isEnabled = isEnabled;
            day.visibility = visibility;
            await migrate_day(day.breaketime.breaketimesJSON, breaketime.breaketimesJSON, day);
            resolve("done");
        })
        .catch(async () => {
            create_day(new Date(date)).then(async day => {
                day.isEnabled = isEnabled;
                day.visibility = visibility;
                day.breaketime = breaketime;
                await getManager().save(day);
                resolve("done");
            })
        });
    });
}

export { add_to_playlist, get_playlist, remove_from_playlist, get_schedule, get_presets, add_preset, set_weekday, get_default_schedule, get_day_info, reset_day_schedule, set_day_schedule };