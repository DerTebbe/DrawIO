import {Coordinate} from './Coordinate';

export interface Path {
  coordinates: Coordinate[];
  width: number;
  color: string | CanvasGradient | CanvasPattern;
  alpha: number;
}
