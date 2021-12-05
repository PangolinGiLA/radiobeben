import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Song } from "./Song";

@Entity()
export class Author {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    displayName: string;

    @OneToMany(() => Song, songs => songs.author)
    songs: Song[];
}