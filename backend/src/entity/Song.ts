import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

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

    @Column()
    author: string;

    @Column()
    filename: string;

    @Column()
    duration: number;

    @Column({ default: false })
    isPrivate: boolean;

}