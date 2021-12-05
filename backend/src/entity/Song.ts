import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Author } from "./Author";

@Entity()
export class Song {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        default: null
    })
    ytid: string;

    @Column()
    title: string;

    @ManyToOne(() => Author, {eager: true})
    author: Author;

    @Column()
    filename: string;

    @Column()
    duration: number;

    @Column({ default: false })
    isPrivate: boolean;

}