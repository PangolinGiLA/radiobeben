import { Entity, PrimaryColumn } from "typeorm";
import { DayInfo } from "../types/DayInfo";

@Entity() 
export class Schedule extends DayInfo {

    @PrimaryColumn()
    weekday: number;
}