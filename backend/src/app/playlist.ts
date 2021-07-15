import { getRepository } from "typeorm";
import { Playlist } from "../entity/Playlist";

function get_playlist(day: Date): Promise<Playlist[]> {
    return getRepository(Playlist).find({ date: day.toISOString().slice(0, 11) }); // toISOString().slice(0, 11) returns date in mysql format
}

export { get_playlist }