/**
 * The server Vector class.
 *
 * @class Vector
 */
export class Vector {
    public x: number;
    public y: number;

    constructor(_x, _y) {
        this.x = _x || 0;
        this.y = _y || 0;
    }

    // return the angle of the vector in radians
    public getDirection() {
        return Math.atan2(this.y, this.x);
    };


// get the magnitude of the vector
    public getMagnitude() {
        // use pythagoras theorem to work out the magnitude of the vector
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };

// set the magnitude of the vector
    public setMagnitude(magnitude) {
        let direction = this.getDirection();
        this.x = Math.cos(direction) * magnitude;
        this.y = Math.sin(direction) * magnitude;
    };

// add two vectors together and return a new one
    public add(v2) {
        return new Vector(this.x + v2.x, this.y + v2.y);
    };

// add a vector to this one
    public addTo(v2) {
        this.x += v2.x;
        this.y += v2.y;
    };

// subtract two vectors and return a new one
    public subtract(v2) {
        return new Vector(this.x - v2.x, this.y - v2.y);
    };

// subtract a vector from this one
    public subtractFrom(v2) {
        this.x -= v2.x;
        this.y -= v2.y;
    };

// multiply this vector by a scalar and return a new one
    public multiply(scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    };

// multiply this vector by the scalar
    public multiplyBy(scalar) {
        this.x *= scalar;
        this.y *= scalar;
    };

// scale this vector by scalar and return a new vector
    public divide(scalar) {
        return new Vector(this.x / scalar, this.y / scalar);
    };

// scale this vector by scalar
    public divideBy(scalar) {
        this.x /= scalar;
        this.y /= scalar;
    };

// get the distance from a vector to this one and return a scalar
    public distance(v2) {
        let a = this.x - v2.x;
        let b = this.y - v2.y;

        return Math.sqrt(a * a + b * b);
    };

// get the distance from a vector to this one and return a scalar
    public lerp(v2, t) {
        this.add((v2.subtract(this)).multiply(t));
    };


// Utilities

//static
    public static lerp(v1, v2, fraction) {
        return v2.subtract(v1).multiply(fraction).add(v1);
    };


    public copy() {
        return new Vector(this.x, this.y);
    };

    public toString() {
        return 'x: ' + this.x + ', y: ' + this.y;
    };

    public toArray() {
        return [this.x, this.y];
    };

    public toObject() {
        return {x: this.x, y: this.y};

    }
}