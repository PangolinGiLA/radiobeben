import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Breaketimes } from "./Breaketimes";

@Entity() 
export class Schedule {

    @PrimaryColumn()
    weekday: number;

    @Column()
    isEnabled: boolean;

    @ManyToOne(() => Breaketimes)
    breaketime: Breaketimes;

    @Column()
    visibility: number;
}