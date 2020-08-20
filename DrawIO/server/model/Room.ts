import {SocketUser} from "./SocketUser";
import {BackgroundSettings} from "./BackgroundSettings";

export interface Room {
    id: number;
    layerID: number;
    socketUsers: SocketUser[];
    layers: Layer[];
    backgroundSettings: BackgroundSettings;
}
