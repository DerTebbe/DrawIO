import { SessionOptions } from 'express-session';
import { ConnectionConfig } from 'mysql';


// Define interfaces here.
interface iAuth {
    callbackURL : string
}
interface iGoogleAuth extends iAuth {
    clientID : string,
    clientSecret : string
}
class AuthConfig {
    googleAuth :iGoogleAuth = {
        clientID : '',
        clientSecret : '',
        callbackURL : ''
    };
}

export class Configuration {

    /**
     * This skeleton file works as a template.
     * Copy this file ill in the information in the mysqlOptions-object and save it as a typescript file: "config.ts"
     * Don't forget to compile it into JavaScript after saving. The name of the file should not be touched!
     * It is marked to be ignored by git since it is a system-specific configuration and should
     * not be overwritten by other team members.
     * You can remove this comment from the ts file afterwards.
     */

    public static sessionOptions: SessionOptions = {
        cookie: {
            maxAge: 1000 * 60 * 5, // 1000ms * 60 (sec) * 5 (min)
        },
        name: '', // The name of the cookie generated by the server, e.g. 'myCookie'
        resave: true, // save with new time stamp (for operating systems without 'touch' command)
        rolling: true, // re-generate the cookie on every request
        saveUninitialized: true, // save session even if it stores no data
        secret: '', // Encrypt session id using this modifier, e.g. 'Secret'
    };

    public static configAuth: AuthConfig = new AuthConfig();

}