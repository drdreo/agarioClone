"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Vector_1 = require("./Vector");
/**
 * The server cell class.
 *
 * @class Cell
 */
var Cell = /** @class */ (function () {
    function Cell(_id, _name, _x, _y, _size, _color) {
        this.id = _id;
        this.name = _name;
        this.size = _size;
        this.color = _color;
        this.pos = new Vector_1.Vector(_x, _y);
        this.vel = new Vector_1.Vector(0, 0);
        this.speed = 3;
    }
    Cell.prototype.eats = function (cell) {
        var distance = this.pos.distance(cell.pos);
        return (distance < this.size + cell.size) && (this.size > 1.1 * cell.size);
    };
    Cell.prototype.toObject = function () {
        return {
            id: this.id,
            name: this.name,
            size: this.size,
            color: this.color,
            pos: this.pos,
            vel: this.vel,
            speed: this.speed
        };
    };
    return Cell;
}());
exports.Cell = Cell;
