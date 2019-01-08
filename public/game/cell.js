/**
 * Created by Andreas on 08.07.17.
 *
 * Client side cell object
 */


function Cell(x, y, size, ctx, color) {

    this.pos = new Vector(x, y);
    this.size = size;

    this.color = color;
    this.display = function () {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, 2 * Math.PI);
        ctx.fillStyle = this.color || "green";
        ctx.fill();
    };


    this.eats = function (cell) {
        var distance = this.pos.distance(cell.pos);
        return distance < this.size + cell.size;
    }
}