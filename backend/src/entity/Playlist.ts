import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import { Song } from "./Song";

@Entity()
export class Playlist {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Song, {onDelete: 'CASCADE'})
    songID: Song;

    @Column("date")
    date: string;

    @Column()
    breakNumber: number;

    @Column("timestamp")
    estTime: Date;
}