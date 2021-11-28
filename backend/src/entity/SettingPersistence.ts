import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class SettingPersistence {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    value: number;
}