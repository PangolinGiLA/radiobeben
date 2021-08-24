import { Column, Entity, ManyToOne } from "typeorm";
import { Breaketimes } from "../entity/Breaketimes";

@Entity() 
export class DayInfo {
    @Column()
    isEnabled: boolean;

    @ManyToOne(() => Breaketimes)
    breaketime: Breaketimes;

    @Column()
    visibility: number;
}