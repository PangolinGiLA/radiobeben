import { getRepository } from "typeorm";
import { Breaketimes } from "../entity/Breaketimes";
import { Days } from "../entity/Days";
import { Playlist } from "../entity/Playlist";
import { Break } from "../types/Time";

function get_playlist(date: Date, userid?: number): Promise<Playlist[]> {
    // TODO: only if day is public or user has permission
    return new Promise<Playlist[]>(async (resolve, reject) => {
        let daysTable = getRepository(Days);
        let day = await daysTable.findOne(
            { date: date.toISOString().slice(0, 11) }, // toISOString().slice(0, 11) returns date in mysql format
            { relations: ["playlist"] }
        );
        resolve(day.playlist);
    });
}

function add_to_playlist(day: Date, breaknumber: number, songid: number, userid?: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
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
        // or if the break just begings
        // and calculate when the song ends ( start + length )
        resolve("done");
    });
}

function remove_from_playlist(playlistid: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        // delete song
        // and move other songs at this break
        // so there won't be any gaps
        resolve("done");
    });
}

function add_preset(name: string, breaktimes: Break[]): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        let breaketimesTable = getRepository(Breaketimes);
        await breaketimesTable.insert({ name: name, breaketimesJSON: breaktimes });
        resolve("done");
    });
}




export { get_playlist }