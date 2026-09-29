import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Widget {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "text" })
  config!: string;
}
