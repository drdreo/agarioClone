/*
 * http://www.andreas-hahn.at
 *
 * Agar.io Server
 *
 * by Hahn Andreas
 *
 */
import * as express from "express";
import * as socket_io from "socket.io";
import {Cell} from "./game/Cell";
import {Vector} from "./game/Vector";


type Client = { socket: any, username: string };
type ClientArray = { [key: string]: Client };
type CellArray = { [key: string]: any };

/**
 * The server.
 *
 * @class Server
 */
export class Server {

    public app: express.Application;

    private server: any;
    private io: any;

    //array that holds all connected clients
    private clientArray: ClientArray[];

    private cellArray: CellArray[];
    private foodArray: CellArray[];
    private foodID: number;
    private virus: Cell[];

    //setting variables
    private sideBorder: number;


    /**
     * Bootstrap the application.
     *
     * @class Server
     * @method bootstrap
     * @static
     * @return Returns a new Server.
     */
    public static bootstrap(): Server {
        return new Server();
    }

    /**
     * Constructor.
     *
     * @class Server
     * @constructor
     */
    constructor() {

        //create expressjs application
        this.app = express();

        this.io = socket_io.listen(9991);

        this.clientArray = [];

        this.cellArray = [];
        this.foodArray = [];
        this.foodID = 0;
        this.virus = [];

        this.sideBorder = 3000;

        //configure application
        this.config();
        //init food
        this.initFood();
        //event handler and listeners
        this.socketListeners();

        this.heartBeat();
    }

    /**
     * Getters for Cells and Client by ID
     *
     * @class Server
     * @method setUsername
     */
    private getCellByID(socket_id) {
        return this.cellArray[socket_id];
    }

    private getClientByID(socket_id) {
        return this.clientArray[socket_id];
    }

    /**
     * Configure application
     *
     * @class Server
     * @method config
     */
    public config() {
        //define static public folder
        this.app.use(express.static("public"));

        /*app.listen() returns an http.Server object, use "0.0.0.0" to access it over the network, dunno why*/
        this.server = this.app.listen(4310, "0.0.0.0", () => {
            let host = this.server.address().address;
            let port = this.server.address().port;
            console.log("Example app listening at http://%s:%s", host, port)
        });

    }

    /**
     * Initialize food at random positions inside the canvas
     *
     * @class Server
     * @method initFood
     */
    private initFood() {
        while (this.foodID++ < 500) {
            let x = random(-this.sideBorder, this.sideBorder);
            let y = random(-this.sideBorder, this.sideBorder);
            this.foodArray[this.foodID] = new Cell(this.foodID, "Food", x, y, 16, "black");
        }
    }

    /**
     * Add food at random positions inside the canvas
     *
     * @class Server
     * @method addFood
     */
    private addFood(amount) {
        while (amount-- != 0) {
            let x = random(-this.sideBorder, this.sideBorder);
            let y = random(-this.sideBorder, this.sideBorder);
            this.foodArray[++this.foodID] = new Cell(++this.foodID, "Food", x, y, 16, "black");
        }
    }

    /**
     * Listeners and Handlers for WebSockets (socket.io)
     *
     * @class Server
     * @method socketListeners
     */
    public socketListeners() {

        // on newly created connection
        this.io.sockets.on('connection', (socket: any) => {

            let clientName = socket.handshake.query.name;
            console.log('[server](connect): New connection from %s', socket.id);

            socket.broadcast.send("<b style='color: cornflowerblue;'>" + clientName + " joined!</b>");

            //insert new client to the clients array
            this.clientArray[socket.id] = {socket: socket, username: clientName};

            //TODO: fix the disconnect/Join speed bug
            //on client start event
            socket.on('start', (data: any) => {
                let x = random(-this.sideBorder, this.sideBorder);
                let y = random(-this.sideBorder, this.sideBorder);
                this.cellArray[socket.id] = new Cell(socket.id, clientName, x, y, 64, data.color);
                //add new Food
                this.addFood(3);
                //tell the player where he starts
                socket.emit('gameSetup', {
                    pos: {"x": x, "y": y},
                    size: 64,
                    color: data.color
                });

            });


            //update cycle, client sends its mouseVector
            socket.on('update', (data: any) => {

                let myCell = this.cellArray[socket.id];

                if (myCell) {
                    let newVel = new Vector(data.mouseVector.x, data.mouseVector.y);
                    newVel.setMagnitude(myCell.speed * 128 / myCell.size);
                    myCell.vel = Vector.lerp(myCell.vel, newVel, 0.1);
                    myCell.pos.addTo(myCell.vel);

                    //map boundaries
                    let overlap = myCell.size / 3;
                    if (myCell.pos.x > this.sideBorder - overlap) {
                        myCell.pos.x = this.sideBorder - overlap;
                    }
                    if (myCell.pos.y > this.sideBorder - overlap) {
                        myCell.pos.y = this.sideBorder - overlap;
                    }
                    if (myCell.pos.x < -this.sideBorder + overlap) {
                        myCell.pos.x = -this.sideBorder + overlap;
                    }
                    if (myCell.pos.y < -this.sideBorder + overlap) {
                        myCell.pos.y = -this.sideBorder + overlap;
                    }

                }
            });


            //on key press from user, sprint for a short period
            socket.on('sprint', () => {
                console.log('Sprinter active for: %s', socket.id);
                let cell = this.getCellByID(socket.id);
                let original_speed = cell.speed;
                cell.speed *= 5;

                setTimeout(function () {
                    cell.speed = original_speed;
                }, 5000);
            });


            socket.on('disconnect', () => {
                console.log('[server](disconnect): %s', socket.id);

                let me = this.getClientByID(socket.id);
                //if there are still players, tell them somebody left
                if (this.clientArray.length != 0) {
                    socket.broadcast.send("<b style='color: darkred;'>" + me.username + " left!</b>");
                }
                //remove this client
                delete this.clientArray[socket.id];

            });


            //for calculating latency of the server - client
            socket.on('ping_check', () => {
                socket.emit('pong_check');
            });


            // on client message
            socket.on('message', (m: any) => {
                console.log('[server](message): %s', m);
                socket.broadcast.send(m);
            });
        });
    }


    private eatCell(eaterID, eatenID) {
        console.log("Cell eaten: " + eatenID);

        //find the cell, delete it
        let eatenSize = this.cellArray[eatenID].size;
        let eaterCell = this.cellArray[eaterID];

        //remove eaten cell
        delete this.cellArray[eatenID];
        //tell the cell he's dead
        this.io.to(eatenID).emit('dead');

        let sum = Math.PI * eaterCell.size * eaterCell.size + Math.PI * eatenSize * eatenSize;
        eaterCell.size = Math.sqrt(sum / Math.PI);
    }

    private eatFood(eater, foodID) {
        console.log("Food eaten: " + foodID);

        //find the food, delete it
        let eatenSize = this.foodArray[foodID].size;
        let myCell = this.cellArray[eater];

        delete this.foodArray[foodID];

        let sum = Math.PI * myCell.size * myCell.size + Math.PI * eatenSize * eatenSize;
        myCell.size = Math.sqrt(sum / Math.PI);

        //add new Food
        this.addFood(1);
    }

    private checkEats() {

        for (let key in this.cellArray) {
            let cell = this.cellArray[key];

            //check every food, if it shall be eaten
            for (let fk in  this.foodArray) {
                if (cell.eats(this.foodArray[fk])) {
                    this.eatFood(key, fk);
                }
            }

            //check every cell(except self), if it eats another cell
            for (let key2 in this.cellArray) {
                if (key2 != key && cell.eats(this.cellArray[key2])) {
                    this.eatCell(key, key2);
                }
            }
        }
    }

    private gameLoop() {
        this.checkEats();

        //convert the object to a simple value array
        let cells = [];
        for (let key in this.cellArray) {
            cells.push(this.cellArray[key]);
        }
        let food = [];
        for (let key in this.foodArray) {
            food.push(this.foodArray[key]);
        }
        this.io.sockets.emit("heartbeat", {cells: cells, food: food, viruses: this.virus});
    }

    /**
     * Sets the interval in what the loops shall be called
     *
     * @class Server
     * @method heartBeat
     */
    private heartBeat() {

        setInterval(() => {
            this.gameLoop()
        }, 1000 / 60);
    }
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}


let server = Server.bootstrap();
let module;
module.exports = server.app;
