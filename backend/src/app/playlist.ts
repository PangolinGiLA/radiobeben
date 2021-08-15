import { Between, getManager, getRepository } from "typeorm";
import { Breaketimes } from "../entity/Breaketimes";
import { Days } from "../entity/Days";
import { Playlist } from "../entity/Playlist";
import { Break } from "../types/Time";
import { Schedule } from "../entity/Schedule"
import { Song } from "../entity/Song";
import { can, permissions } from "./permissions";
import { cfg } from "../config/general";

// I assume there already is schedule database prepered,
// that there are entries for each week day
// for now you have to insert them manualy
// later it will be checked and fixed on startup

function get_playlist(date: Date, userid?: number): Promise<Playlist[]> {
    // TODO: only if day is public or user has permission
    return new Promise<Playlist[]>(async (resolve, reject) => {
        let daysTable = getRepository(Days);
        let day = await daysTable.findOne(
            { date: jsDatetoSQLDate(date) }, // toISOString().slice(0, 11) returns date in mysql format
            { relations: ["playlist", "playlist.song"] }
        );
        if (day)
            resolve(day.playlist);
        else
            resolve([]);
    });
}

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
            reject("no such song");
            return;
        }

        let daysTable = getRepository(Days);
        let playlistTable = getRepository(Playlist);

        // first 
        // is date in future
        if (jsDatetoSQLDate(day) < jsDatetoSQLDate(new Date())) {
            reject("invalid time");
            return;
        }

        // break exists
        if (breaknumber >= schedule.length) {
            reject("break does not exist");
            return;
        }

        // is break not full
        // (check if day already created in Days table)

        let song_end: Date; // will be calculeted in following if

        let that_day = await daysTable.findOne({ date: date })
        if (that_day) {
            // and if exists is the break full
            let last_song = await playlistTable.findOne(
                { breakNumber: breaknumber, day: that_day },
                { order: { estTime: "DESC" }, relations: ["song"] }
            );
            if (last_song) {
                // calculate song end ( song end will be usefull later too )
                song_end = last_song.estTime;
                song_end.setSeconds(last_song.estTime.getSeconds() + last_song.song.duration);

                // calculate break end
                let break_end = day;
                break_end.setHours(schedule[breaknumber].end.hour);
                break_end.setMinutes(schedule[breaknumber].end.minutes);
                break_end.setSeconds(0);

                // if last song ends later than break, break is full
                if (song_end.getTime() >= break_end.getTime()) {
                    reject("break is full");
                    return;
                }

            } else {
                // break is empty
                // just calculate new song start
                let break_start = day;
                break_start.setHours(schedule[breaknumber].start.hour);
                break_start.setMinutes(schedule[breaknumber].start.minutes);
                song_end = break_start;
            }
        }

        // then
        // if logged in and permitted

        if (!userid || !(userid && await can(userid, permissions.playlist))) { // userid will be passed if user is logged in
            // not permitted, need to check more thing

            // some code below will have to change, because I will have diffrent table for authors
            // daily song/author limit if enabled
            // song
            if (cfg.daily_limit.song !== null) {
                if (await playlistTable.count({ day: that_day, song: song }) >= cfg.daily_limit.song) {
                    reject("daily song limit exceeded");
                    return;
                }
            }

            // author
            if (cfg.daily_limit.author !== null) {
                let authors = await playlistTable.createQueryBuilder("playlist")
                    .leftJoinAndSelect('playlist.song', 'song')
                    .where("song.author = :author", { author: song.author })
                    .andWhere("playlist.day = :day", { day: that_day.id })
                    .execute();
                console.log(authors);
                if (authors.length >= cfg.daily_limit.author) {
                    reject("daily author limit exceeded");
                    return;
                }
            }

            // weekly song/author limit if enabled
            //author
            if (cfg.weekly_limit.author !== null) {
                // when week starts and ends
                let monday = getMonday(day);
                let next_monday = new Date(monday);
                next_monday.setDate(monday.getDate() + 7);
                // crazy query to count
                let songs_week = await playlistTable.createQueryBuilder("playlist")
                    .leftJoinAndSelect('playlist.song', 'song')
                    .leftJoinAndSelect('playlist.day', 'day')
                    .where("song.author = :author", { author: song.author })
                    .andWhere("day.date >= :monday", { monday: jsDatetoSQLDate(monday) })
                    .andWhere("day.date < :n_monday", { n_monday: jsDatetoSQLDate(next_monday) })
                    .execute();
                // and compare
                if (songs_week.length >= cfg.weekly_limit.author) {
                    reject("weekly author limit exceeded");
                    return;
                }
            }

            // song TODO

            // monthly song/author limit if enabled
            // is day private
            // is date not too far in future
            // is song with that id private

        }



        // now if song can be added
        // calculate when song starts
        // depending on end of the last song
        // let result = playlistTable.find({ where: { day: newday, breakNumber: breaknumber }, order: { estTime: "ASC" } });
        // or if the break just begings
        // and calculate when the song ends ( start + length )

        // check if there already is database record for that day
        // if not, create it
        let newday = await daysTable.findOne({ date: date }, { relations: ["playlist"] });
        if (!newday) {
            let scheduleTable = getRepository(Schedule);
            let schedule = await scheduleTable.findOne({ weekday: day.getDay() }, { relations: ["breaketime"] })
            newday = new Days()
            newday.date = date;
            newday.playlist = [];
            newday.breaketime = schedule.breaketime;
            newday.isEnabled = schedule.isEnabled;
            newday.visibility = schedule.visibility;

            await daysTable.insert(newday);
        }

        let playlist = new Playlist();
        playlist.breakNumber = breaknumber;
        playlist.song = song;
        playlist.day = newday;
        playlist.estTime = song_end;


        await playlistTable.save(playlist);

        resolve("done");
    });
}

function fix_break(removedSong: Playlist): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let result = await getManager().query(
            "UPDATE playlist SET estTime=SUBTIME(estTime, ?) WHERE breakNumber=? AND dayId=? AND estTime > ?",
            [removedSong.song.duration, removedSong.breakNumber, removedSong.day.id, removedSong.estTime]
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
            await fix_break(toRemove);
            resolve("done");
        } else {
            reject("no such playlist entry");
        }
    });
}

function add_preset(name: string, breaktimes: Break[]): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let breaketimesTable = getRepository(Breaketimes);
        await breaketimesTable.insert({ name: name, breaketimesJSON: breaktimes });
        resolve("done");
    });
}

function get_schedule(day: Date): Promise<Break[]> {
    return new Promise<Break[]>(async (resolve) => {
        let daysTable = getRepository(Days);
        let dayData = await daysTable.findOne({ date: day.toISOString().slice(0, 11) }, { relations: ["breaketime"] });
        if (dayData) {
            // schedule for this day is already known
            // also need to check for permission
            if (dayData.isEnabled)
                resolve(dayData.breaketime.breaketimesJSON);
            else
                resolve([]);
        } else {
            // return probable schedule depending on weekday
            // also need to check for permission
            let scheduleTable = getRepository(Schedule);
            let schedule = await scheduleTable.findOne({ weekday: day.getDay() }, { relations: ["breaketime"] });
            if (schedule.isEnabled)
                resolve(schedule.breaketime.breaketimesJSON);
            else
                resolve([]);
        }
    });
}

function set_weekday(weekday: number, isEnabled: boolean, breaketimeid?: number, visibility?: number): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let scheduleTable = getRepository(Schedule);
        let breaketimesTable = getRepository(Breaketimes);
        if (isEnabled) {
            let breaketime = await breaketimesTable.findOne(breaketimeid)
            if (breaketime) {
                await scheduleTable.update(weekday, { isEnabled: true, breaketime: breaketime, visibility: visibility });
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

// from https://stackoverflow.com/questions/4156434/javascript-get-the-first-day-of-the-week-from-current-date
function getMonday(d: Date): Date {
    d = new Date(d);
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

function jsDatetoSQLDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

export { add_to_playlist, get_playlist, remove_from_playlist, get_schedule }