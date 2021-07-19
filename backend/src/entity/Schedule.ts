import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Breaketimes } from "./Breaketimes";

@Entity() 
export class Schedule {

    @PrimaryColumn()
    weekday: number;

    @Column()
    isEnabled: boolean;

    @ManyToOne(() => Breaketimes)
    breaketimeid: Breaketimes;

    @Column()
    visibility: number;
}