import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Break } from "../types/Time";

@Entity()
export class Breaketimes {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
    
    @Column()
    isDefault: boolean;

    @Column("simple-json")
    breaketimesJSON: Break[];
}