"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The server Vector class.
 *
 * @class Vector
 */
var Vector = /** @class */ (function () {
    function Vector(_x, _y) {
        this.x = _x || 0;
        this.y = _y || 0;
    }
    // return the angle of the vector in radians
    Vector.prototype.getDirection = function () {
        return Math.atan2(this.y, this.x);
    };
    ;
    // get the magnitude of the vector
    Vector.prototype.getMagnitude = function () {
        // use pythagoras theorem to work out the magnitude of the vector
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    ;
    // set the magnitude of the vector
    Vector.prototype.setMagnitude = function (magnitude) {
        var direction = this.getDirection();
        this.x = Math.cos(direction) * magnitude;
        this.y = Math.sin(direction) * magnitude;
    };
    ;
    // add two vectors together and return a new one
    Vector.prototype.add = function (v2) {
        return new Vector(this.x + v2.x, this.y + v2.y);
    };
    ;
    // add a vector to this one
    Vector.prototype.addTo = function (v2) {
        this.x += v2.x;
        this.y += v2.y;
    };
    ;
    // subtract two vectors and return a new one
    Vector.prototype.subtract = function (v2) {
        return new Vector(this.x - v2.x, this.y - v2.y);
    };
    ;
    // subtract a vector from this one
    Vector.prototype.subtractFrom = function (v2) {
        this.x -= v2.x;
        this.y -= v2.y;
    };
    ;
    // multiply this vector by a scalar and return a new one
    Vector.prototype.multiply = function (scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    };
    ;
    // multiply this vector by the scalar
    Vector.prototype.multiplyBy = function (scalar) {
        this.x *= scalar;
        this.y *= scalar;
    };
    ;
    // scale this vector by scalar and return a new vector
    Vector.prototype.divide = function (scalar) {
        return new Vector(this.x / scalar, this.y / scalar);
    };
    ;
    // scale this vector by scalar
    Vector.prototype.divideBy = function (scalar) {
        this.x /= scalar;
        this.y /= scalar;
    };
    ;
    // get the distance from a vector to this one and return a scalar
    Vector.prototype.distance = function (v2) {
        var a = this.x - v2.x;
        var b = this.y - v2.y;
        return Math.sqrt(a * a + b * b);
    };
    ;
    // get the distance from a vector to this one and return a scalar
    Vector.prototype.lerp = function (v2, t) {
        this.add((v2.subtract(this)).multiply(t));
    };
    ;
    // Utilities
    //static
    Vector.lerp = function (v1, v2, fraction) {
        return v2.subtract(v1).multiply(fraction).add(v1);
    };
    ;
    Vector.prototype.copy = function () {
        return new Vector(this.x, this.y);
    };
    ;
    Vector.prototype.toString = function () {
        return 'x: ' + this.x + ', y: ' + this.y;
    };
    ;
    Vector.prototype.toArray = function () {
        return [this.x, this.y];
    };
    ;
    Vector.prototype.toObject = function () {
        return { x: this.x, y: this.y };
    };
    return Vector;
}());
exports.Vector = Vector;
