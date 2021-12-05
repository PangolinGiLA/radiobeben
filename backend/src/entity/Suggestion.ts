import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Suggestion {
    
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    ytid: string;

    @Column()
    name: string;

    @Column()
    author: string;

    @Column()
    duration: number;

    @Column()
    views: number;

    @Column({default: 0})
    status: number;
}