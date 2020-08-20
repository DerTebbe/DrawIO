import {Path} from './Path';

export interface Layer {
  userID: string;
  layerID: number;
  paths: Path[];
}
