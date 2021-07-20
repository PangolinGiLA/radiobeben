import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Breaketimes } from "./Breaketimes";
import { Playlist } from "./Playlist";

@Entity()
export class Days {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("date")
    date: string;

    @OneToMany(() => Playlist, playlist => playlist.day)
    playlist: Playlist[];

    @ManyToOne(() => Breaketimes)
    breaketime: Breaketimes;

    @Column()
    isEnabled: boolean;

    @Column()
    visibility: number;
}