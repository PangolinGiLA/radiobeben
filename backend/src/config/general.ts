export const cfg = {
    song_folder: "Music", // folder to download songs
    daily_limit: {
        song: 10, // can be null, will be disabled
        author: 10
    },
    weekly_limit: {
        song: 10,
        author: 10
    },
    monthly_limit: {
        song: 10,
        author: 10
    },
    days_in_future: 10,
    playlist_priority: false, // should manualy played song be stopped if it's time for playlist song?
    stop_on_break_end: true, // should song be stopped when break ends?
    time_offset : 0,
}