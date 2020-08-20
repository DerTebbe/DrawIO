/*****************************************************************************
 * Import package                                                            *
 *****************************************************************************/
import cryptoJS = require ('crypto-js');
import express = require ('express');
import bodyParser = require("body-parser");
import session = require ('express-session');
import passport = require('passport');
import socket = require('socket.io');
import {Request, Response} from 'express';
import {Configuration} from '../config/config';
import {Rights} from '../model/rights';
import {User} from '../model/user';
import '../model/Path';
import '../model/Coordinate';
import '../model/Layer';
import {
    Collection,
    Db,
    DeleteWriteOpResultObject, FindOneOptions,
    InsertOneWriteOpResult,
    MongoClient,
    ObjectID,
    UpdateWriteOpResult
} from "mongodb";
import * as pGoogle from 'passport-google-oauth20';
import {Profile} from 'passport';
import * as fs from "fs";
import * as https from "https";
import {Socket} from 'socket.io';
import * as http from "http";
import {Drawing} from "../model/Drawing";
import {DrawingComment} from "../model/DrawingComment";
import {Room} from "../model/Room";
import {SocketUser} from "../model/SocketUser";
import {BackgroundSettings} from "../model/BackgroundSettings";
import {Message} from "../model/Message";

/*****************************************************************************
 * Define app and database connection                                        *
 *****************************************************************************/
const app = express();

let client: MongoClient;
let database: Db;
let userlist: Collection<User>;
let imagelist: Collection<Drawing>;
let logins: Collection<{ user: User, date: Date }>;

/*****************************************************************************
 * Configure web-app                                                         *
 *****************************************************************************/
//app.use(express.json());
app.use(session(Configuration.sessionOptions));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));

// required for passport
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

let GoogleStrategy = pGoogle.Strategy;
passport.use(new GoogleStrategy({
        clientID: Configuration.configAuth.googleAuth.clientID,
        clientSecret: Configuration.configAuth.googleAuth.clientSecret,
        callbackURL: Configuration.configAuth.googleAuth.callbackURL,
        passReqToCallback: true // allows us to pass in the req from our route
    },
    async function (req, accessToken, refreshToken, params, profile, done) {
        try {
            let query: Object = {googleID: profile.id};
            let googleUser: User = await userlist.findOne(query);
            if (!googleUser) {
                // put user into database
                let userToInsert: User = new User(profile.displayName, null, profile.name.givenName, profile.name.familyName, new Date(), Rights.User);
                userToInsert["googleID"] = profile.id;
                await userlist.insertOne(userToInsert);
                googleUser = await userlist.findOne(query);
            }
            // convert google user to conventional user
            googleUser.id = googleUser["_id"];
            delete googleUser["_id"];
            // log in user by setting the session cookie
            req.session.user = googleUser;
            pushLogin(googleUser);
        } catch (err) {
            // Database operation has failed
            console.log('Database request failed: ' + err);
        }
        done(null, profile);
    }
));
// used to serialize the user for the session
passport.serializeUser(function (profile: Profile, done) {
    done(null, profile);
});
// used to deserialize the user
passport.deserializeUser(function (profile: Profile, done) {
    done(null, profile);
});


/*****************************************************************************
 * Start server and connect to database                                      *
 *****************************************************************************/
let privateKey = fs.readFileSync(__dirname + '/sslcert/localhost.key', 'utf8');
let certificate = fs.readFileSync(__dirname + '/sslcert/localhost.crt', 'utf8');
let credentials = {key: privateKey, cert: certificate};
let port = process.env.PORT || 8443;
let host = process.env.API_URL || 'localhost';
let mongo_host = process.env.MONGO_HOST || 'localhost';
let mongo_port = process.env.MONGO_PORT || 27017;
let production: boolean = JSON.parse((process.env.PRODUCTION || 'false'));
//general database query options
const options: FindOneOptions = {projection:{password:0}};

let server;
if (production) {
    console.log("Starting in production mode");
    server = http.createServer(app);
} else {
    console.log("Starting in dev mode");
    server = https.createServer(credentials, app);
}
server.listen(port, async () => {
    console.log(`
        -------------------------------------------------------------
        Server started: https://${host}:${port}
        Database Config: mongodb://${mongo_host}:${mongo_port}
        Google Callback URL: ${process.env.G_CLIENT_CALLBACKURL}
        -------------------------------------------------------------
    `);
    // Start up database connection
    try {
        // Use connect method to connect to the Server
        client = await MongoClient.connect(`mongodb://${mongo_host}:${mongo_port}`, {
            useUnifiedTopology: true
        });
        database = client.db("drawio");
        userlist = database.collection<User>("userlist");
        imagelist = database.collection<Drawing>("imagelist");
        logins = database.collection<{ user: User, date: Date }>("logins");
        console.log("Database is connected ...\n");
    } catch (err) {
        console.error("Error connecting to database ...\n" + err);
    }
});

/*****************************************************************************
 * CORS                                                                      *
 *****************************************************************************/
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

/*****************************************************************************
 * Middleware routes for session management (login and authentication)       *
 *****************************************************************************/
/**
 * @apiDefine SessionExpired
 *
 * @apiError (Client Error) {401} SessionNotFound The session of the user is expired or was not set
 *
 * @apiErrorExample SessionNotFound:
 * HTTP/1.1 401 Unauthorized
 * {
 *     "message":"Session expired, please log in again."
 * }
 */
function isLoggedIn() {
    // Abstract middleware route for checking login state of the user
    return (req: Request, res: Response, next) => {
        if (req.session.user || (req.session.passport && req.session.passport.user)) {
            // User has an active session and is logged in, continue with route
            next();
        } else {
            // User is not logged in
            res.status(401).send({
                message: 'Session expired, please log in again',
            });
        }
    };
}

/**
 * @apiDefine NotAuthorized
 *
 * @apiError (Client Error) {403} NotAuthorized The user trying to create a new user is not logged in
 *
 * @apiErrorExample NotAuthorized:
 * HTTP/1.1 403 Forbidden
 * {
 *     "message":"Cannot create user since you have insufficient rights"
 * }
 */
function isPrivilegedAtLeast(rights: Rights) {
    // Abstract middleware route for checking privilege of the user
    return (req: Request, res: Response, next) => {
        if (req.session.user && rights > Number(req.session.user.rights)) {
            // User is not privileged, reject request
            res.status(403).send({
                message: 'You are not allowed to execute this action',
            });
        } else {
            // User is privileged, continue with route
            next();
        }
    };
}

function pushLogin(user: User) {
    // Abstract middleware route
    let data: any = {
        "user": user,
        "date": new Date()
    };
    logins.insertOne(data);
}

/*****************************************************************************
 * HTTP ROUTES: LOGIN                                                        *
 *****************************************************************************/
/**
 * @api {get} /login Request login state
 * @apiName GetLogin
 * @apiGroup Login
 * @apiVersion 2.0.0
 *
 * @apiSuccess {User} user The user object
 * @apiSuccess {string} message Message stating that the user is still logged in
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "user":{
 *         "id":1,
 *         "username":"Kneiselnator2000",
 *         "firstName":"Peter",
 *         "lastName":"Kneisel",
 *         "creationDate":"2017-11-12T09:33:25.000Z",
 *         "rights":"2"
 *      },
 *      "message":"User still logged in"
 *  }
 *
 * @apiError (Client Error) {401} SessionNotFound The session of the user is expired or was not set
 *
 * @apiErrorExample SessionNotFound:
 * HTTP/1.1 401 Unauthorized
 * {
 *     "message":"Session expired, please log in again."
 * }
 */
app.get('/login', isLoggedIn(), async (req: Request, res: Response) => {
    const query: Object = {_id: new ObjectID(req.session.user.id)};
    try {
        let user: User = await userlist.findOne(query, options);
        if (user) {
            user.id = user["_id"];
            delete user["_id"];
            req.session.user = user;
            res.status(200).send({
                message: 'User still logged in',
                user: req.session.user, // Send user object to client for greeting message
            });
        }
    } catch (err) {
        // Login data is incorrect, user is not logged in
        res.status(500).send({
            message: 'Database request failed: ' + err,
        });
    }
});

/**
 * @api {post} /login Send login request
 * @apiName PostLogin
 * @apiGroup Login
 * @apiVersion 2.0.0
 *
 * @apiParam {string} username Username of the user to log in
 * @apiParam {string} password Password of the user to log in
 *
 * @apiSuccess {User} user The user object
 * @apiSuccess {string} message Message stating the user logged in successfully
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "user":{
 *         "id":1,
 *         "username":"Kneiselnator2000",
 *         "firstName":"Peter",
 *         "lastName":"Kneisel",
 *         "creationDate":"2017-11-12T09:33:25.000Z",
 *         "rights":"2"
 *     },
 *     "message":"Successfully logged in"
 * }
 *
 * @apiError (Client Error) {401} LoginIncorrect The login data provided is not correct.
 * @apiError (Server Error) {500} DatabaseRequestFailed The request to the database failed.
 *
 * @apiErrorExample LoginIncorrect:
 * HTTP/1.1 401 Unauthorized
 * {
 *     "message":"Username or password is incorrect."
 * }
 *
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 500 Internal Server Errror
 * {
 *     "message":"Database request failed: ..."
 * }
 */
app.post('/login', async (req: Request, res: Response) => {
    // Read data from request
    const username: string = req.body.username;
    const password: string = req.body.password;

    // Create database query and data
    const query: Object = {
        username: username,
        password: cryptoJS.SHA512(password).toString()
    };

    try {
        let user: User = await userlist.findOne(query, options);
        if (user) {
            user.id = user["_id"];
            delete user["_id"];
            // Login data is incorrect, user is not logged in
            req.session.user = user; // Store user object in session for authentication
            res.status(200).send({
                message: 'Successfully logged in',
                user, // Send user object to client for greeting message
            });
            pushLogin(user)
        } else {
            res.status(401).send({
                message: 'Username or password is incorrect.',
            });
        }
    } catch (err) {
        // Login data is incorrect, user is not logged in
        res.status(500).send({
            message: 'Database request failed: ' + err,
        });
    }
});

// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
app.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));
// the callback after google has authenticated the user
app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/'
    })
);

/**
 * @api {post} /logout Logout user
 * @apiName PostLogout
 * @apiGroup Logout
 * @apiVersion 2.0.0
 *
 * @apiSuccess {string} message Message stating that the user is logged out
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     message: "Successfully logged out"
 * }
 */
app.post('/logout', (req: Request, res: Response) => {
    // Log out user
    delete req.session.user; // Delete user from session
    res.status(200).send({
        message: 'Successfully logged out'
    });
});

/*****************************************************************************
 * HTTP ROUTES: USER                                                         *
 *****************************************************************************/
/**
 * @api {post} /user Create a new user
 * @apiName PostUser
 * @apiGroup User
 * @apiVersion 2.0.0
 *
 * @apiUse SessionExpired
 * @apiUse NotAuthorized
 *
 * @apiParam {string} firstName First name of the user
 * @apiParam {string} lastName Last name of the user
 * @apiParam {string} username Username of the user
 * @apiParam {string} password Password of the user
 *
 * @apiSuccess {string} message Message stating the new user has been created successfully
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "userId": 0,
 *     "message":"Successfully created new user"
 * }
 *
 * @apiError (Client Error) {400} NotAllMandatoryFields The request did not contain all mandatory fields
 * @apiError (Server Error) {500} DatabaseRequestFailed The request to the database failed.
 *
 * @apiErrorExample NotAllMandatoryFields:
 * HTTP/1.1 400 Bad Request
 * {
 *     "message":"Not all mandatory fields are filled in"
 * }
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 500 Internal Server Error
 * {
 *     "message":"Database request failed: ..."
 * }
 */
app.post('/user', async (req: Request, res: Response) => {
    // Read data from request
    const firstName: string = req.body.firstName;
    const lastName: string = req.body.lastName;
    const username: string = req.body.username;
    const password: string = cryptoJS.SHA512(req.body.password).toString();
    const noLogin: boolean = req.body.noLogin;
    let rights: Rights = Rights.User;
    if (isPrivilegedAtLeast(Rights.Admin) && req.body.rights) {
        rights = req.body.rights;
    }

    // Check that all arguments are given
    if (firstName && lastName && username && password) {

        const query: Object = {username: username};
        let checkUsername: User = await userlist.findOne(query, options);
        if (checkUsername) {
            res.status(400).send({
                message: 'Username already in use',
            });
            return;
        }

        let user: User = new User(username, password, firstName, lastName, new Date(), rights);
        try {
            let result: InsertOneWriteOpResult<User> = await userlist.insertOne(user);
            user.id = result.insertedId.toString();
            if (!noLogin) {
                req.session.user = user;
            } // Store user object in session for authentication
            // The user was created
            res.status(200).send({
                userId: result.insertedId,
                message: 'Successfully created new user',
            });
        } catch (err) {
            // Query could not been executed
            res.status(500).send({
                message: 'Database request failed: ' + err,
            });
        }
    } else {
        res.status(400).send({
            message: 'Not all mandatory fields are filled in',
        });
    }
});

/**
 * @api {get} /user:userId Get user with given id
 * @apiName GetUser
 * @apiGroup User
 * @apiVersion 2.0.0
 *
 * @apiUse SessionExpired
 *
 * @apiParam {number} userId The id of the requested user
 *
 * @apiSuccess {User} user The requested user object
 * @apiSuccess {string} message Message stating the user has been found
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "user":{
 *         "id":1,
 *         "firstName":"Peter",
 *         "lastName":"Kneisel",
 *         "username":"admin",
 *         "creationDate":"2018-10-21 14:19:12",
 *         "rights":2
 *     },
 *     "message":"Successfully got user"
 * }
 *
 *  @apiError (Client Error) {404} NotFound The requested user can not be found
 *  @apiError (Server Error) {500} DatabaseRequestFailed The request to the database failed
 *
 * @apiErrorExample NotFound:
 * HTTP/1.1 404 Not Found
 * {
 *     "message":"The requested user can not be found."
 * }
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 500 Internal Server Error
 * {
 *     "message":"Database request failed: ..."
 * }
 */
app.get('/user/:userId', isLoggedIn(), async (req: Request, res: Response) => {

    // request user from database
    try {
        // Read data from request and create database query and data
        const query: Object = {_id: new ObjectID(req.params.userId)};
        let user: User = await userlist.findOne(query, options);
        if (user !== null) {
            user.id = user["_id"];
            delete user["_id"];
            res.status(200).send({
                message: 'Successfully got user',
                user: user
            });
        } else {
            res.status(404).send({
                message: 'The requested user can not be found.',
            });
        }
    } catch (err) {
        // Database operation has failed
        res.status(500).send({
            message: 'Database request failed: ' + err,
        });
    }
});

/**
 * @api {put} /user/:userId Update user with given id
 * @apiName PutUser
 * @apiGroup User
 * @apiVersion 2.0.0
 *
 * @apiUse SessionExpired
 * @apiUse NotAuthorized
 *
 * @apiParam {number} userId The id of the requested user
 * @apiParam {string} firstName The (new) first name of the user
 * @apiParam {string} lastName The (new) last name of the user
 * @apiParam {string} password Optional: The (new) password of the user
 *
 * @apiSuccess {string} message Message stating the user has been updated
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "message":"Successfully updated user ..."
 * }
 *
 * @apiError (Client Error) {400} NotAllMandatoryFields The request did not contain all mandatory fields
 * @apiError (Client Error) {404} NotFound The requested user can not be found
 * @apiError (Server Error) {500} DatabaseRequestFailed The request to the database failed
 *
 * @apiErrorExample NotAllMandatoryFields:
 * HTTP/1.1 400 Bad Request
 * {
 *     "message":"Not all mandatory fields are filled in"
 * }
 *
 * @apiErrorExample NotFound:
 * HTTP/1.1 404 Not Found
 * {
 *     "message":"The user can not be found"
 * }
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 500 Internal Server Error
 * {
 *     "message":"Database request failed: ..."
 * }
 */
app.put('/user/:userId', isLoggedIn(), async (req: Request, res: Response) => {
    // Read data from request
    const user = req.body.user;
    const userId: string = req.params.userId;
    const firstName: string = user.firstName;
    const lastName: string = user.lastName;
    const username: string = user.username;
    const rights: number = user.rights;
    const password: string = req.body.password;

    if (userId !== req.session.user.id && req.session.user.rights < Rights.Admin) {
        res.status(403).send({
            message: 'You are not allowed to execute this action',
        });
    }
    // Define data for database query
    let updateData: Object;

    // Check that all arguments are given
    if (firstName && lastName && username) {
        // check if password was provided
        if (password) {
            updateData = {
                firstName: firstName,
                lastName: lastName,
                username: username,
                rights: rights,
                password: cryptoJS.SHA512(password).toString()
            };
        } else {
            updateData = {firstName: firstName, lastName: lastName, username: username, rights: rights,};
        }
        // Execute database query
        try {
            // Define data for database query
            let query: Object = {_id: new ObjectID(userId)};
            let result: UpdateWriteOpResult = await userlist.updateOne(query, {$set: updateData});
            if (result.matchedCount === 1) {
                // The user was updated
                res.status(200).send({
                    message: 'Successfully updated user ' + userId,
                });
            } else {
                // The user can not be found
                res.status(404).send({
                    message: 'The user can not be found',
                });
            }
        } catch (err) {
            // Query could not been executed
            res.status(500).send({
                message: 'Database request failed: ' + err,
            });
        }
    } else {
        res.status(400).send({
            message: 'Not all mandatory fields are filled in',
        });
    }
});

/**
 * @api {delete} /user/:userId Delete user with given id
 * @apiName DeleteUser
 * @apiGroup User
 * @apiVersion 2.0.0
 *
 * @apiUse SessionExpired
 * @apiUse NotAuthorized
 *
 * @apiParam {number} userId The id of the requested user
 *
 * @apiSuccess {string} message Message stating the user has been updated
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "message":"Successfully deleted user ..."
 * }
 *
 *  @apiError (Client Error) {404} NotFound The requested user can not be found
 *  @apiError (Server Error) {500} DatabaseRequestFailed The request to the database failed
 *
 * @apiErrorExample NotFound:
 * HTTP/1.1 404 Not Found
 * {
 *     "message":"The requested user can not be deleted"
 * }
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 500 Internal Server Error
 * {
 *     "message":"Database request failed: ..."
 * }
 */
app.delete('/user/:userID', isLoggedIn(), async (req: Request, res: Response) => {
    const userID: string = req.params.userID;
    if (userID === req.session.user.id || isPrivilegedAtLeast(Rights.Admin)) {
        // Delete user from database
        try {
            const query: Object = {_id: new ObjectID(userID)};
            let result: DeleteWriteOpResultObject = await userlist.deleteOne(query);
            if (result.deletedCount === 1) {
                res.status(200).send({
                    message: 'Successfully deleted user ' + userID,
                });
            } else {
                // No user found to delete
                res.status(404).send({
                    message: 'The requested user can not be deleted.',
                });
            }
        } catch (err) {
            // Database operation has failed
            res.status(500).send({
                message: 'Database request failed: ' + err,
            });
        }
    } else {
        res.status(403).send({
            message: 'You cant just delete any user',
        });
    }
});

/*****************************************************************************
 * HTTP ROUTES: USERS                                                        *
 *****************************************************************************/
/**
 * @api {get} /users Get all users
 * @apiName GetUsers
 * @apiGroup Users
 * @apiVersion 2.0.0
 *
 * @apiUse SessionExpired
 *
 * @apiSuccess {User[]} userList The list of all users
 * @apiSuccess {string} message Message stating the users have been found
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "user":{
 *         "id":1,
 *         "firstName":"Peter",
 *         "lastName":"Kneisel",
 *         "username":"admin",
 *         "creationDate":"2018-10-21 14:19:12",
 *         "rights":2
 *     },
 *     "message":"Successfully got user"
 * }
 *
 *  @apiError (Server Error) {500} DatabaseRequestFailed The request to the database failed
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 500 Internal Server Error
 * {
 *     "message":"Database request failed: ..."
 * }
 */
app.get('/users', isLoggedIn(), isPrivilegedAtLeast(Rights.Admin), async (req: Request, res: Response) => {
    // Create database query and data
    const query: Object = {};

    // request user from database
    try {
        let userList: User[] = await userlist.find(query, options).toArray();
        userList.forEach(user => {
            user.id = user["_id"];
            delete user["_id"];
        });
        // Send user list to client
        res.status(200).send({
            message: 'Successfully requested user list',
            userList
        });
    } catch (err) {
        // Database operation has failed
        res.status(500).send({
            message: 'Database request failed: ' + err,
        });
    }
});

/**
 * @api {get} /stats/login/history/:skip/:limit Get login history
 * @apiName GetLoginhistory
 * @apiGroup Admin
 * @apiVersion 2.0.0
 *
 * @apiParam {number} skip Index of where to start getting logins
 * @apiParam {number} limit Index of where to end getting logins
 *
 * @apiSuccess {Object} loginHistory History of all logins
 * @apiSuccess {string} message Message stating the login history has been loaded
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "loginHistory": [
 *         0: {
 *             user: {
 *                "id":1,
 *                "firstName":"Peter",
 *                "lastName":"Kneisel",
 *                "username":"admin",
 *                "creationDate":"2018-10-21 14:19:12",
 *                "rights":2
 *             },
 *             date: 2020-01-09T09:53:26.087+00:00
 *         }
 *     ]
 *     "message": "Successfully requested login history"
 * }
 *
 *  @apiError (Server Error) {500} DatabaseRequestFailed The request to the database failed
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 500 Internal Server Error
 * {
 *     "message":"Database request failed: ..."
 * }
 */

app.get('/stats/login/history/:skip/:limit', isLoggedIn(), isPrivilegedAtLeast(Rights.Admin), async (req: Request, res: Response) => {
    const skip: number = Number(req.params.skip);
    const limit: number = Number(req.params.limit);
    let loginHistory: {user: User, date: Date }[] = [];
    try {
        //loginHistory = await logins.find().toArray();
        loginHistory = await logins.find().skip(skip).limit(limit).sort({date: -1}).toArray();
        // Send user list to client
        res.status(200).send({
            message: 'Successfully requested login history',
            loginHistory
        });
    } catch (err) {
        // Database operation has failed
        res.status(500).send({
            message: 'Database request failed: ' + err,
        });
    }
});

/**
 * @api {get} /stats/count/:collection Get count of documents in collection
 * @apiName GetDocumentCountOfCollection
 * @apiGroup Admin
 * @apiVersion 2.0.0
 *
 * @apiParam {string} collection Collection whose documents should be counted
 *
 * @apiSuccess {number} count Number of documents in collection
 * @apiSuccess {string} message Message stating count of documents in collection has been loaded
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "count": 3
 *     "message": "Successfully requested count logins"
 * }
 *
 *  @apiError (Server Error) {500} DatabaseRequestFailed The request to the database failed
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 500 Internal Server Error
 * {
 *     "message":"Database request failed: ..."
 * }
 */

app.get('/stats/count/:collection', isLoggedIn(), isPrivilegedAtLeast(Rights.Admin), async (req: Request, res: Response) => {
    let collectionName = req.params.collection;
    let collectionMap: Map<string, Collection> = new Map<string, Collection>();
    collectionMap.set("userlist", userlist);
    collectionMap.set("imagelist", imagelist);
    collectionMap.set("logins", logins);

    if (collectionMap.has(collectionName)) {
        try {
            let count = await collectionMap.get(collectionName).find().count();
            res.status(200).send({
                message: 'Successfully requested count ' + collectionName,
                count: count
            });
        } catch (err) {
            // Database operation has failed
            res.status(500).send({
                message: 'Database request failed: ' + err,
            });
        }
    } else {
        res.status(404).send({
            message: 'could not  count ' + collectionName,
        })
    }
});

/**
 * @api {get} /stats/users/admin Get count of admins
 * @apiName GetAdminCount
 * @apiGroup Admin
 * @apiVersion 2.0.0
 *
 * @apiSuccess {User[]} admins List of admins
 * @apiSuccess {string} message Message stating count of documents in collection has been loaded
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "admins": [
 *         0: {
 *            "id":1,
 *            "username":"Kneiselnator2000",
 *            "firstName":"Peter",
 *            "lastName":"Kneisel",
 *            "creationDate":"2017-11-12T09:33:25.000Z",
 *            "rights":"2"
 *            },
 *     ],
 *     "message": "Successfully requested admin count"
 * }
 *
 * @apiError (Server Error) {500} DatabaseRequestFailed The request to the database failed
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 500 Internal Server Error
 * {
 *     "message":"Database request failed: ..."
 * }
 */

app.get('/stats/users/admin', isLoggedIn(), isPrivilegedAtLeast(Rights.Admin), async (req: Request, res: Response) => {
    try {
        let admins = await userlist.find({rights: {$gt: 1}}, options).toArray();
        // Send user list to client
        res.status(200).send({
            message: 'Successfully requested admin count',
            admins: admins
        });
    } catch (err) {
        // Database operation has failed
        res.status(500).send({
            message: 'Database request failed: ' + err,
        });
    }
});

/**
 * @api {get} /images/:start/:limit Get imageIDs within given range
 * @apiName GetImageIDs
 * @apiGroup Image
 * @apiVersion 2.0.0
 *
 * @apiParam {number} start Index of where to start getting image ids
 * @apiParam {number} limit Index of where to end getting image ids
 *
 * @apiSuccess {string[]} idList List of image ids within given range
 * @apiSuccess {string} message Message stating the image ids have been found
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "idList": [
 *         '5e17885fb54c120ab05bcfd0',
 *         '5e1791f998821e047069d375'
 *     ]
 *     "message": "Successfully requested image list"
 * }
 *
 *  @apiError (Server Error) {500} DatabaseRequestFailed The request to the database failed
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 500 Internal Server Error
 * {
 *     "message":"Database request failed: ..."
 * }
 */

app.get('/images/:start/:limit', async (req: Request, res: Response) => {
    const start: number = Number(req.params.start);
    const limit: number = Number(req.params.limit);
    // Create database query and data
    const query: Object = {};

    // request images from database
    try {
        let imageList: Drawing[];
        imageList = await imagelist.find(query, {}).skip(start).limit(limit).sort({_id: -1}).toArray();
        let idList: string[] = [];
        imageList.forEach(image => {
            idList.push(image["_id"])
        });
        // Send image list to client
        res.status(200).send({
            message: 'Successfully requested image list',
            idList: idList
        });
    } catch (err) {
        // Database operation has failed
        res.status(500).send({
            message: 'Database request failed: ' + err,
        });
    }
});

/**
 * @api {get} /images/:id Get imageIDs made by given user
 * @apiName GetImageIDsOfUser
 * @apiGroup Image
 * @apiVersion 2.0.0
 *
 * @apiParam {string} id ID of user whose images should be loaded
 *
 * @apiSuccess {string[]} idList List of image ids
 * @apiSuccess {string} message Message stating the image ids have been found
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "idList": [
 *         '5e17885fb54c120ab05bcfd0',
 *         '5e1791f998821e047069d375'
 *     ]
 *     "message": "Successfully requested image list"
 * }
 *
 *  @apiError (Server Error) {500} DatabaseRequestFailed The request to the database failed
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 500 Internal Server Error
 * {
 *     "message":"Database request failed: ..."
 * }
 */

app.get('/images/:id', async (req: Request, res: Response) => {
    const id: string = req.params.id;
    // Create database query and data
    const query: Object = {'authors.id': id};

    // request images from database
    try {
        let imageList: Drawing[];
        imageList = await imagelist.find(query, {}).sort({_id: -1}).toArray();
        let idList: string[] = [];
        imageList.forEach(image => {
            idList.push(image["_id"])
        });
        // Send image list to client
        res.status(200).send({
            message: 'Successfully requested image list',
            idList: idList
        });
    } catch (err) {
        // Database operation has failed
        res.status(500).send({
            message: 'Database request failed: ' + err,
        });
    }
});

/**
 * @api {get} /image/:id Get image with given id
 * @apiName GetImage
 * @apiGroup Image
 * @apiVersion 2.0.0
 *
 * @apiParam {string} id The id of the requested image
 *
 * @apiSuccess {Image} image The requested image object
 * @apiSuccess {string} message Message stating the image has been found
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "image":{
 *         "id": '5e17885fb54c120ab05bcfd0',
 *         "comments": [],
 *         "description": "Expressionistisches Bild eines Baums auf einer grünen Weide",
 *         "authors": [
 *             0: {
 *                 username: 'Kneiselnator2000',
 *                 password: 'ba3253876aed6bc22d4a6ff53d8406c6ad864195ed144ab5c87621b6c233b548baeae6956df346ec8c17f5ea10f35ee3cbc514797ed7ddd3145464e2a0bab413',
 *                 firstName: 'Peter',
 *                 lastName: 'Kneisel',
 *                 creationDate: '2020-01-08T19:23:00.112Z',
 *                 rights: '0',
 *                 id: '5e162c14cc7c242d74a33629'
 *             }
 *         ],
 *         "timestamp": "2020-01-09T20:09:03.433Z",
 *         "imageData_b64": 'data:image/png;base64,iVBORw0KGgoAAA...'
 *     },
 *     "message": "Successfully requested image by id: 5e17885fb54c120ab05bcfd0"
 * }
 *
 *  @apiError (Server Error) {500} DatabaseRequestFailed The request to the database failed
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 500 Internal Server Error
 * {
 *     "message":"Database request failed: ..."
 * }
 */

app.get('/image/:id', async (req: Request, res: Response) => {
    // Create database query and data
    const id: string = req.params.id;
    const query: Object = {_id: new ObjectID(id)};

    // request image from database
    try {
        let image: Drawing = await imagelist.findOne(query);
        image.id = image["_id"];
        delete image["_id"];
        // Send image to client
        res.status(200).send({
            message: 'Successfully requested image by id: ' + id,
            image: image
        });
    } catch (err) {
        // Database operation has failed
        res.status(500).send({
            message: 'Database request failed: ' + err,
        });
    }
});

/**
 * @api {post} /image Persist a new image
 * @apiName PostImage
 * @apiGroup Image
 * @apiVersion 2.0.0
 *
 * @apiParam {string} title Title of image
 * @apiParam {string} description Last name of the user
 * @apiParam {User[]} authors Authors of image
 * @apiParam {Date} timestamp Timestamp of when image was created
 * @apiParam {string} image_b64 Image as a string
 *
 * @apiSuccess {string} message Message stating the new image has been created successfully
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "imageId": '5e17885fb54c120ab05bcfd0',
 *     "message":"Successfully created new image"
 * }
 *
 * @apiError (Server Error) {500} DatabaseRequestFailed The request to the database failed.
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 500 Internal Server Error
 * {
 *     "message":"Database request failed: ..."
 * }
 */

app.post('/image', async (req: Request, res: Response) => {
    // Read data from request
    const title: string = req.body.title;
    const description: string = req.body.description;
    const authors: User[] = req.body.authors;
    const timestamp: Date = req.body.timestamp;
    const imageData_b64: string = req.body.imageDataB64;

    let image: Drawing = new Drawing(title, description, authors, timestamp, imageData_b64);
    try {
        let result: InsertOneWriteOpResult<Drawing> = await imagelist.insertOne(image);
        // The image was created
        res.status(200).send({
            imageId: result.insertedId,
            message: 'Successfully created new image',
        });
    } catch (err) {
        // Query could not been executed
        res.status(500).send({
            message: 'Database request failed: ' + err,
        });
    }
});

/**
 * @api {put} /image/:id Update image with given id
 * @apiName PutImage
 * @apiGroup Image
 * @apiVersion 2.0.0
 *
 * @apiParam {id} userId The id of the requested image
 * @apiParam {DrawingComment[]} comments List of comments for given image
 *
 * @apiSuccess {string} message Message stating the image has been updated
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "message":"Successfully updated image 5e17885fb54c120ab05bcfd0"
 * }
 *
 * @apiError (Client Error) {404} NotFound The requested image can not be found
 * @apiError (Server Error) {500} DatabaseRequestFailed The request to the database failed
 *
 * @apiErrorExample NotFound:
 * HTTP/1.1 404 Not Found
 * {
 *     "message":"The image can not be found"
 * }
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 500 Internal Server Error
 * {
 *     "message":"Database request failed: ..."
 * }
 */

app.put('/image/:id', async (req: Request, res: Response) => {
    // Read data from request
    const id: string = req.params.id;
    const comments: DrawingComment[] = req.body.comments;

    let query = {_id: new ObjectID(id)};
    let updateData = {comments: comments};
    try {
        let result: UpdateWriteOpResult = await imagelist.updateOne(query, {$set: updateData});
        if (result.modifiedCount === 1) {
            // The user was updated
            res.status(200).send({
                message: 'Successfully updated image ' + id,
            });
        } else {
            // The user can not be found
            res.status(404).send({
                message: 'The image can not be found',
            });
        }
    } catch (err) {
        // Query could not been executed
        res.status(500).send({
            message: 'Database request failed: ' + err,
        });
    }
});

/**
 * @api {delete} /image/:id Delete image with given id
 * @apiName DeleteImage
 * @apiGroup Image
 * @apiVersion 2.0.0
 *
 * @apiParam {string} id The id of the image that should be deleted
 *
 * @apiSuccess {string} message Message stating the image has been deleted
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "message":"Successfully deleted image 5e17885fb54c120ab05bcfd0"
 * }
 *
 *  @apiError (Client Error) {404} NotFound The requested image can not be deleted
 *  @apiError (Server Error) {500} DatabaseRequestFailed The request to the database failed
 *
 * @apiErrorExample NotFound:
 * HTTP/1.1 404 Not Found
 * {
 *     "message":"The requested image can not be deleted"
 * }
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 500 Internal Server Error
 * {
 *     "message":"Database request failed: ..."
 * }
 */

app.delete('/image/:id', async (req: Request, res: Response) => {
    const id: string = req.params.id;
    // Delete user from database
    try {
        const query: Object = {_id: new ObjectID(id)};
        let result: DeleteWriteOpResultObject = await imagelist.deleteOne(query);
        if (result.deletedCount === 1) {
            res.status(200).send({
                message: 'Successfully deleted image ' + id,
            });
        } else {
            // No image found to delete
            res.status(404).send({
                message: 'The requested image can not be deleted.',
            });
        }
    } catch (err) {
        // Database operation has failed
        res.status(500).send({
            message: 'Database request failed: ' + err,
        });
    }
});


/*****************************************************************************
 * SOCKET CONFIGURATION                                                      *
 *****************************************************************************/
let io = socket(server);
let rooms: Room[] = [];
let roomID: number = 0;
io.on('connection', (socket: Socket) => {
    console.log('Client connected: ' + socket.id);
    // REMINDER: SOCKET-ID CHANGES ON PAGE REFRESH AS IT COUNTS AS DISCONNECT AND (RE-)CONNECT

    // Disconnect listener
    socket.on('disconnect', () => {
        console.log('Client disconnected.');
        // remove user from all rooms
        const tmpRooms: Room[] = rooms.filter((room: Room) => room.socketUsers.map((su: SocketUser) => su.socket.id).includes(socket.id));
        for (const room of tmpRooms) {
            const socketUser: SocketUser = room.socketUsers.find((su: SocketUser) => su.socket.id === socket.id);
            room.socketUsers.splice(room.socketUsers.indexOf(socketUser), 1);
            // close room if noone is using it
            if (room.socketUsers.length === 0) {
                rooms.splice(rooms.indexOf(room), 1);
            }
        }
    });

    socket.on('socketID', () => {
        socket.emit('socketID', socket.id);
    });

    socket.on('addLayer', (info: {roomID: number, user: User}) => {
        const room: Room = rooms.find((room: Room) => room.id === info.roomID);
        if (room) {
            const layer: Layer = {userID: info.user.id, layerID: room.layerID++, paths: []};
            room.layers.push(layer);
            sendToSocketUsers(room.socketUsers, 'addLayer', layer);
        }
    });

    socket.on('removeLayer', (info: {roomID: number, layerID: number, user: User}) => {
        const room: Room = rooms.find((room: Room) => room.id === info.roomID);
        if (room) {
            const layer = room.layers.find((layer: Layer) => layer.layerID === info.layerID);
            if (layer && layer.userID === info.user.id) {
                room.layers.splice(room.layers.indexOf(layer), 1);
                sendToSocketUsers(room.socketUsers, 'removeLayer', info.layerID);
            }
        }
    });

    socket.on('draw', (drawInfo: { roomID: number, layerID: number, path: Path }) => {
        const room: Room = rooms.find((room: Room) => room.id === drawInfo.roomID);
        if (room) {
            const layer = room.layers.find((layer: Layer) => layer.layerID === drawInfo.layerID);
            if (layer) {
                // add to layer
                layer.paths.push(drawInfo.path);
                // send
                delete drawInfo.roomID;
                sendToSocketUsers(room.socketUsers, 'draw', drawInfo);
            }
        }
    });

    socket.on('drawBackground', (info: {roomID: number, background: BackgroundSettings}) => {
        const room: Room = rooms.find((room: Room) => room.id === info.roomID);
        if (room) {
            room.backgroundSettings = info.background;
            sendToSocketUsers(room.socketUsers.filter((su: SocketUser) => su.socket.id !== socket.id), 'drawBackground', room.backgroundSettings);
            socket.broadcast.emit('drawBackground', room.backgroundSettings);
        }
    });

    socket.on('clearLayer', (info: { roomID: number, layerID: number }) => {
        const room: Room = rooms.find((room: Room) => room.id === info.roomID);
        if (room) {
            const layer = room.layers.find((layer: Layer) => layer.layerID === info.layerID);
            if (layer) {
                layer.paths = [];
                // send
                sendToSocketUsers(room.socketUsers, 'clearLayer', layer.layerID);
            }
        }
    });

    socket.on('updateLayerOrder', (info: { roomID: number, layerIDs: number[] }) => {
        const room: Room = rooms.find((room: Room) => room.id === info.roomID);
        if (room) {
            const tmp: Layer[] = [];
            for (const layerID of info.layerIDs) {
                const layer: Layer = room.layers.find((l: Layer) => l.layerID === layerID);
                if (layer) {
                    tmp.push(layer);
                }
            }
            room.layers = tmp;
            sendToSocketUsers(room.socketUsers.filter((su: SocketUser) => su.socket.id !== socket.id), 'updateLayerOrder', info.layerIDs);
        }
    });

    socket.on('createRoom', (user: User) => {
        if (user) {
            const room: Room = {
                id: roomID++,
                layerID: 0,
                socketUsers: [],
                layers: [],
                backgroundSettings: {visible: true, color: '#FFFFFF'}
            };
            rooms.push(room);
            socket.emit('createRoom', room.id);
        }
    });

    socket.on('joinRoom', (info: {user: User, roomID: number}) => {
        if (info.user) {
            const room: Room = rooms.find((room: Room) => room.id === info.roomID);
            let userIsInNoOtherRoom: boolean = true;
            const allUsersInOtherRooms: SocketUser[][] = rooms.filter((r: Room) => r.id !== room.id).map((r: Room) => r.socketUsers);
            for (const temp of allUsersInOtherRooms) {
                for (const tmp of temp) {
                    if (tmp.user.id === info.user.id) {
                        userIsInNoOtherRoom = false;
                        break;
                    }
                }
            }
            if (room) {
                // only allow user to join if he is not in another room
                if (userIsInNoOtherRoom) {
                    // (re-)insert user into room
                    const socketUser: SocketUser = {socket: socket, user: info.user};
                    room.socketUsers.push(socketUser);
                    sendToSocketUsers([socketUser], 'synchronize', {
                        layers: room.layers,
                        backgroundSettings: room.backgroundSettings
                    });
                }
            }
        }
    });

    socket.on('getValidRoom', (roomID: number) => {
        const room: Room = rooms.find((room: Room) => room.id === roomID);
        if (room) {
            // send room available
            socket.emit('validRoom', roomID);
        } else {
            socket.emit('invalidRoom', roomID);
        }
    });
    socket.on('leaveRoom', (info: { user: User, roomID: number }) => {
        const room: Room = rooms.find((room: Room) => room.id === info.roomID);
        if (room && info.user) {
            const socketUser = room.socketUsers.find((su: SocketUser) => su.user.id === info.user.id && su.socket.id === socket.id);
            if (socketUser) {
                room.socketUsers.splice(room.socketUsers.indexOf(socketUser), 1);
                if (room.socketUsers.length === 0) {
                    rooms.splice(rooms.indexOf(room), 1);
                }
            }
        }
    });

    socket.on('getUsers', (roomID: number) => {
        const room: Room = rooms.find((room: Room) => room.id === roomID);
        if (room) {
            socket.emit('getUsers', room.socketUsers.map((su: SocketUser) => su.user));
        }
    });

    socket.on('message', (message: Message) => {
        const room: Room = rooms.find((room: Room) => room.id === message.roomID);
        if (room) {
            message.date = new Date();
            sendToSocketUsers(room.socketUsers, 'message', message);
        }
    });
});

function sendToSocketUsers(socketUsers: SocketUser[], event: string, data?: any): void {
    for (const socketUser of socketUsers) {
        socketUser.socket.emit(event, data);
    }
}

/**
 * @api {get} /getUsers/:roomID Get users of room
 * @apiName GetUsersOfRoom
 * @apiGroup Room
 * @apiVersion 2.0.0
 *
 * @apiParam {number} roomID The id of the requested room
 *
 * @apiSuccess {User[]} users List of all user objects of requested room
 * @apiSuccess {string} message Message stating the users have been found
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  users: [
 *      0: {
 *      username: 'Kneiselnator2000',
 *      password: 'ba3253876aed6bc22d4a6ff53d8406c6ad864195ed144ab5c87621b6c233b548baeae6956df346ec8c17f5ea10f35ee3cbc514797ed7ddd3145464e2a0bab413',
 *      firstName: 'Peter',
 *      lastName: 'Kneisel',
 *      creationDate: '2020-01-08T19:23:00.112Z',
 *      rights: '0',
 *      id: '5e162c14cc7c242d74a33629'
 *      }
 *  ],
 *  message: 'Successfully requested users of room'
 * }
 *
 * @apiError (Server Error) {404} NoExistingRoom Room Could not find room
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 400 Not found
 * {
 *     "message": "Could not find room"
 * }
 */

app.get('/getUsers/:roomID', async (req: Request, res: Response) => {
    const roomID: number = Number(req.params.roomID);
    const room: Room = rooms.find((room: Room) => room.id === roomID);
    if (room) {
        let users: User[] = [];
        room.socketUsers.forEach((socketUser: SocketUser) => {
            users.push(socketUser.user);
        });
        res.status(200).send({
            message: 'Successfully requested users of room',
            users: users
        });
    } else {
        res.status(404).send({
            message: 'Could not find room'
        });
    }
});

/**
 * @api {get} /checkRoom/:roomID Check if room is available
 * @apiName CheckRoomID
 * @apiGroup Room
 * @apiVersion 2.0.0
 *
 * @apiParam {string} roomID The id of room that should be checked
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 *
 * @apiError (Server Error) {400} RoomIsNotAvailable The requested room is not available
 *
 * @apiErrorExample DatabaseRequestFailed:
 * HTTP/1.1 400 Bad request
 * {
 *     "message": "The room is not available."
 * }
 */

app.get('/checkRoom/:roomID', isLoggedIn(), (req: Request, res: Response) => {
    const roomID = Number.parseInt(req.params.roomID, 10);
    if (rooms.map((r: Room) => r.id).includes(roomID)) {
        res.status(200).send();
    } else {
        res.status(400).send({
            message: 'The room is not available.'
        });
    }
});

/*****************************************************************************
 * SEND APPLICATION VIA SERVER                                               *
 *****************************************************************************/

app.use("/", express.static(__dirname + "/../../client/dist/DrawIO"));
// Routen innerhalb der Angular-Anwendung zurückleiten
app.use("/*", express.static(__dirname + "/../../client/dist/DrawIO"));
