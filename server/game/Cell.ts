import {Vector} from "./Vector";

/**
 * The server cell class.
 *
 * @class Cell
 */
export class Cell {
    public pos: Vector;
    public size: number;
    public vel: Vector;
    public speed: number;

    public id: string;
    private name: string;
    public color: string;

    constructor(_id, _name, _x, _y, _size, _color) {
        this.id = _id;
        this.name = _name;
        this.size = _size;
        this.color = _color;
        this.pos = new Vector(_x, _y);
        this.vel = new Vector(0, 0);
        this.speed = 3;
    }


    public eats(cell) {
        let distance = this.pos.distance(cell.pos);
        return (distance < this.size + cell.size) && (this.size > 1.1 * cell.size);
    }

    public toObject() {
        return {
            id: this.id,
            name: this.name,
            size: this.size,
            color: this.color,
            pos: this.pos,
            vel: this.vel,
            speed: this.speed
        };

    }
}