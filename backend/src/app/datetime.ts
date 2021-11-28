import { Time } from "../types/Time";

function setHMS(date: Date, hours: number, minutes: number, seconds: number) {
    date = new Date(date); // idk, just to be sure
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(seconds);
    return date;
}

function SQLtime(date: Date): string {
    let h = String(date.getHours()).padStart(2, "0");
    let m = String(date.getMinutes()).padStart(2, "0");
    let s = String(date.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
}

function SQLdatetime(date: Date): string {
    return SQLdate(date) + ' ' + SQLtime(date);
}

function SQLdate(date: Date): string {
    let y = String(date.getFullYear());
    let m = String(date.getMonth() + 1).padStart(2, "0");
    let d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`
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

function jsDatetoSQLDate(d: Date): string { // TODO: replace every occurence with SQLdate
    return SQLdate(d);
}

function secondsToHMS(seconds: number): string {
    let d = new Date();
    d = setHMS(d, 0, 0, seconds);
    return SQLtime(d);
}

function my_time_to_Date(time: Time): Date {
    var new_time = new Date();
    new_time.setHours(time.hour);
    new_time.setMinutes(time.minutes);
    new_time.setSeconds(0);
    new_time.setMilliseconds(0);
    return new_time;
}

export {secondsToHMS, jsDatetoSQLDate, getMonday, SQLdate, SQLtime, SQLdatetime, setHMS, my_time_to_Date};