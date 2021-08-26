import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DayInfo } from "../types/DayInfo";
import { Playlist } from "./Playlist";

@Entity()
export class Days extends DayInfo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("date")
    date: string;

    @Column({ default: true })
    hasDefaultSchedule: boolean

    @OneToMany(() => Playlist, playlist => playlist.day)
    playlist: Playlist[];
}