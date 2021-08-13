import { getManager, getRepository } from "typeorm";
import { Breaketimes } from "../entity/Breaketimes";
import { Days } from "../entity/Days";
import { Playlist } from "../entity/Playlist";
import { Break } from "../types/Time";
import { Schedule } from "../entity/Schedule"
import { Song } from "../entity/Song";

// I assume there already is schedule database prepered,
// that there are entries for each week day
// for now you have to insert them manualy
// later it will be checked and fixed on startup

function get_playlist(date: Date, userid?: number): Promise<Playlist[]> {
    // TODO: only if day is public or user has permission
    return new Promise<Playlist[]>(async (resolve, reject) => {
        let daysTable = getRepository(Days);
        let day = await daysTable.findOne(
            { date: date.toISOString().slice(0, 11) }, // toISOString().slice(0, 11) returns date in mysql format
            { relations: ["playlist", "playlist.song"] }
        );
        if (day)
            resolve(day.playlist);
        else
            resolve(null);
    });
}

function add_to_playlist(day: Date, breaknumber: number, songid: number, userid?: number): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        // get date from Date
        let date = day.toISOString().slice(0, 11);

        // check if song exists
        let songTable = getRepository(Song);
        let song = await songTable.findOne(songid);
        if (!song) {
            reject("no such song");
        }

        let playlistTable = getRepository(Playlist);

        // check a lot of things
        // first 
        // is date in future
        // is break not full
        // then
        // if logged in and permitted
        // just add
        // else check things like
        // daily song/author limit if enabled
        // weekly song/author limit if enabled
        // monthly song/author limit if enabled
        // is day private
        // is date not too far in future
        // is song with that id private

        // now if song can be added
        // calculate when song starts
        // depending on end of the last song
        // let result = playlistTable.find({ where: { day: newday, breakNumber: breaknumber }, order: { estTime: "ASC" } });
        // or if the break just begings
        // and calculate when the song ends ( start + length )

        let daysTable = getRepository(Days);

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
        playlist.estTime = new Date(); // need to count this later


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
    return new Promise<Break[]>(async (resolve, reject) => {
        let daysTable = getRepository(Days);
        let dayData = await daysTable.findOne({ date: day.toISOString().slice(0, 11) }, { relations: ["breaketime"] });
        if (dayData) {
            // schedule for this day is already known
            // also need to check for permission
            if (dayData.isEnabled)
                resolve(dayData.breaketime.breaketimesJSON)
            else
                reject(); // can you reject like that? 
        } else {
            // return probable schedule depending on weekday
            // also need to check for permission
            let scheduleTable = getRepository(Schedule);
            let schedule = await scheduleTable.findOne({ weekday: day.getDay() }, { relations: ["breaketime"] });
            if (schedule.isEnabled)
                resolve(schedule.breaketime.breaketimesJSON);
            else
                reject();
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


export { add_to_playlist, get_playlist, remove_from_playlist, get_schedule }