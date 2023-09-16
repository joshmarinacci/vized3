import {Bounds, Point} from "josh_js_util"

export interface Handle {
    getPosition(): Point;
    setPosition(pos: Point): Promise<void>;
    contains(pt: Point): boolean;
}

export interface ScaledSurface {
    fillRect(bounds: Bounds, fill: string): void;
    strokeRect(bounds: Bounds, strokeFill: string, strokeWidth: number): void;
    outlineRect(bounds: Bounds): void;

    fillRoundRect(bounds: Bounds, roundedCornersRadius: number, fill: string): void;
    strokeRoundRect(bounds: Bounds, roundedCornersRadius: number, strokeFill: string, strokeWidth: number): void;

    fillArc(center: Point, radius: number, startAngle: number, endAngle: number, fill: string): void;
    strokeArc(center: Point, radius: number, startAngle: number, endAngle: number, strokeFill: string, strokeWidth: number): void;
    outlineArc(center: Point, radius: number, startAngle: number, endAngle: number): void;

    fillText(text: string, center: Point, fill: string, fontSize: number): void;

    fillLinePath(position: Point, points: Point[], closed: boolean, fill: string): void;
    strokeLinePath(position: Point, points: Point[], closed: boolean, strokeFill: string, strokeWidth: number): void;
    outlineLinePath(position: Point, points: Point[], closed: boolean): void;

    dragRect(dragRect: Bounds): void;

    overlayFillText(s: string, point: Point): void;

    overlayHandle(hand: Handle, color:string): void;

    overlayPoint(point: Point, green: string): void;

    overlayLine(startPoint: Point, endPoint: Point, color: string): void;

    fillImage(bounds: Bounds, img: unknown): void
}

export interface DrawableShape {
    drawSelf(ctx:ScaledSurface):void
    contains(pt:Point):boolean
    drawSelected(ctx:ScaledSurface):void
    getHandle():Handle|null
    intersects(bounds:Bounds):boolean
    getPosition():Point
    setPosition(pos:Point):Promise<void>
    getAlignmentBounds():Bounds;
    translateBy(offset: Point): Promise<void>
}
