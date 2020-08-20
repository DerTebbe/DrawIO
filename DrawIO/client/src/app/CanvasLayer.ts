import {Layer} from './Layer';

export interface CanvasLayer {
  canvas: HTMLCanvasElement;
  listItem: HTMLLIElement;
  layer: Layer;
}
