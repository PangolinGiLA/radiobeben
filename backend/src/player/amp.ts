import { Break } from "../types/Time";
import { get_day_info } from "../app/playlist"
import { my_time_to_Date } from "../app/datetime";
import { getConnection, getRepository } from "typeorm";
import { SettingPersistence } from "../entity/SettingPersistence";
import SerialPort = require('serialport');
import { cfg } from "../config/general";

export enum mode {
    ON,
    AUTO,
    OFF
};

export class Amp {
    breaks: Break[] = [];
    mode: mode = mode.OFF;
    break_getter = null;
    break_checker = null;
    
    port = new SerialPort(cfg.serial_port, { autoOpen: false });
    enabled = false;

    constructor() {
        let settingsTable = getRepository(SettingPersistence);
        settingsTable.findOne({ name: "amp_mode" }).then(setting => {
            this.change_mode(setting.value, false);
        });
        this.get_curr_breaks();
        // idk how this thing works
        // but i took it from previous system
        // i assume it is needed
        this.port.on('open', function () {
            this.port.write('s');
        }.bind(this));

        if (!this.port.isOpen) {
            this.port.open(function (err) {
                if (err) {
                    console.error("faiiled to open port with amp!")
                    console.error(err);
                }
            });
        }
    }

    setup_intervals() {
        this.break_getter = setInterval(this.get_curr_breaks.bind(this), 5000);
        this.break_checker = setInterval(this.autoamp.bind(this), 1000);
    }

    autoamp() {
        if (this.is_break()) {
            this.port.write('+');
            this.enabled = true;
        } else {
            this.port.write('-');
            this.enabled = false;
        }
    }

    get_curr_breaks = async () => {
        let info = await get_day_info(new Date());
        if (info.isEnabled)
        {
            if (info.breaketime)
                this.breaks = info.breaketime.breaketimesJSON;
        } else {
            this.breaks = [];
        }

    }

    is_break = () => {
        for (let i of this.breaks) {
            if (my_time_to_Date(i.start) <= new Date() && my_time_to_Date(i.end) >= new Date()) {
                return true;
            }
        }
        return false;
    }

    public change_mode = (new_mode: mode, save = true) => {
        this.mode = new_mode;
        // save to db
        if (save) {
            let settingsTable = getRepository(SettingPersistence);
            settingsTable.findOne({ name: "amp_mode" }).then(setting => {
                setting.value = new_mode;
                settingsTable.save(setting);
            });
        }
        if (new_mode == mode.AUTO) {
            this.setup_intervals();
        } else {
            clearInterval(this.break_getter);
            clearInterval(this.break_checker);
            if (new_mode == mode.OFF) {
                this.port.write('-');
                this.enabled = false;
            } else {
                this.port.write('+');
                this.enabled = true;
            }
        }
    }

    public get_mode = () => {
        return this.mode;
    }
}