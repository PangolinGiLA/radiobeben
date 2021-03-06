import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import { Days } from "./Days";
import { Song } from "./Song";

@Entity()
export class Playlist {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Song, {onDelete: 'CASCADE'})
    song: Song;

    @ManyToOne(() => Days, day => day.playlist)
    day: Days;

    @Column()
    breakNumber: number;

    @Column("datetime")
    estTime: Date;
}