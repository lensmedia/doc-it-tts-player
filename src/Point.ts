import { clamp } from "./Utils";

export default class Point {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(point: Point) {
        return new Point(
            this.x + point.x,
            this.y + point.y,
        );
    }

    subtract(point: Point) {
        return new Point(
            this.x - point.x,
            this.y - point.y,
        );
    }

    multiply(amount: Point | number) {
        if (amount instanceof Point) {
            return new Point(
                this.x * amount.x,
                this.y * amount.y,
            );
        } else {
            return new Point(
                this.x * amount,
                this.y * amount,
            );
        }
    }

    clamp(min: Point = Point.zero, max: Point = Point.one) {
        return new Point(
            clamp(this.x, min.x, max.x),
            clamp(this.y, min.y, max.y),
        );
    }

    static get zero() { return new Point(0, 0); }
    static get one() { return new Point(1, 1); }
}
