"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * http://www.andreas-hahn.at
 *
 * Agar.io Server
 *
 * by Hahn Andreas
 *
 */
var express = require("express");
var socket_io = require("socket.io");
var Cell_1 = require("./game/Cell");
var Vector_1 = require("./game/Vector");
/**
 * The server.
 *
 * @class Server
 */
var Server = /** @class */ (function () {
    /**
     * Constructor.
     *
     * @class Server
     * @constructor
     */
    function Server() {
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
     * Bootstrap the application.
     *
     * @class Server
     * @method bootstrap
     * @static
     * @return Returns a new Server.
     */
    Server.bootstrap = function () {
        return new Server();
    };
    /**
     * Getters for Cells and Client by ID
     *
     * @class Server
     * @method setUsername
     */
    Server.prototype.getCellByID = function (socket_id) {
        return this.cellArray[socket_id];
    };
    Server.prototype.getClientByID = function (socket_id) {
        return this.clientArray[socket_id];
    };
    /**
     * Configure application
     *
     * @class Server
     * @method config
     */
    Server.prototype.config = function () {
        var _this = this;
        //define static public folder
        this.app.use(express.static("public"));
        /*app.listen() returns an http.Server object, use "0.0.0.0" to access it over the network, dunno why*/
        this.server = this.app.listen(4310, "0.0.0.0", function () {
            var host = _this.server.address().address;
            var port = _this.server.address().port;
            console.log("Example app listening at http://%s:%s", host, port);
        });
    };
    /**
     * Initialize food at random positions inside the canvas
     *
     * @class Server
     * @method initFood
     */
    Server.prototype.initFood = function () {
        while (this.foodID++ < 500) {
            var x = random(-this.sideBorder, this.sideBorder);
            var y = random(-this.sideBorder, this.sideBorder);
            this.foodArray[this.foodID] = new Cell_1.Cell(this.foodID, "Food", x, y, 16, "black");
        }
    };
    /**
     * Add food at random positions inside the canvas
     *
     * @class Server
     * @method addFood
     */
    Server.prototype.addFood = function (amount) {
        while (amount-- != 0) {
            var x = random(-this.sideBorder, this.sideBorder);
            var y = random(-this.sideBorder, this.sideBorder);
            this.foodArray[++this.foodID] = new Cell_1.Cell(++this.foodID, "Food", x, y, 16, "black");
        }
    };
    /**
     * Listeners and Handlers for WebSockets (socket.io)
     *
     * @class Server
     * @method socketListeners
     */
    Server.prototype.socketListeners = function () {
        var _this = this;
        // on newly created connection
        this.io.sockets.on('connection', function (socket) {
            var clientName = socket.handshake.query.name;
            console.log('[server](connect): New connection from %s', socket.id);
            socket.broadcast.send("<b style='color: cornflowerblue;'>" + clientName + " joined!</b>");
            //insert new client to the clients array
            _this.clientArray[socket.id] = { socket: socket, username: clientName };
            //TODO: fix the disconnect/Join speed bug
            //on client start event
            socket.on('start', function (data) {
                var x = random(-_this.sideBorder, _this.sideBorder);
                var y = random(-_this.sideBorder, _this.sideBorder);
                _this.cellArray[socket.id] = new Cell_1.Cell(socket.id, clientName, x, y, 64, data.color);
                //add new Food
                _this.addFood(3);
                //tell the player where he starts
                socket.emit('gameSetup', {
                    pos: { "x": x, "y": y },
                    size: 64,
                    color: data.color
                });
            });
            //update cycle, client sends its mouseVector
            socket.on('update', function (data) {
                var myCell = _this.cellArray[socket.id];
                if (myCell) {
                    var newVel = new Vector_1.Vector(data.mouseVector.x, data.mouseVector.y);
                    newVel.setMagnitude(myCell.speed * 128 / myCell.size);
                    myCell.vel = Vector_1.Vector.lerp(myCell.vel, newVel, 0.1);
                    myCell.pos.addTo(myCell.vel);
                    //map boundaries
                    var overlap = myCell.size / 3;
                    if (myCell.pos.x > _this.sideBorder - overlap) {
                        myCell.pos.x = _this.sideBorder - overlap;
                    }
                    if (myCell.pos.y > _this.sideBorder - overlap) {
                        myCell.pos.y = _this.sideBorder - overlap;
                    }
                    if (myCell.pos.x < -_this.sideBorder + overlap) {
                        myCell.pos.x = -_this.sideBorder + overlap;
                    }
                    if (myCell.pos.y < -_this.sideBorder + overlap) {
                        myCell.pos.y = -_this.sideBorder + overlap;
                    }
                }
            });
            //on key press from user, sprint for a short period
            socket.on('sprint', function () {
                console.log('Sprinter active for: %s', socket.id);
                var cell = _this.getCellByID(socket.id);
                var original_speed = cell.speed;
                cell.speed *= 5;
                setTimeout(function () {
                    cell.speed = original_speed;
                }, 5000);
            });
            socket.on('disconnect', function () {
                console.log('[server](disconnect): %s', socket.id);
                var me = _this.getClientByID(socket.id);
                //if there are still players, tell them somebody left
                if (_this.clientArray.length != 0) {
                    socket.broadcast.send("<b style='color: darkred;'>" + me.username + " left!</b>");
                }
                //remove this client
                delete _this.clientArray[socket.id];
            });
            //for calculating latency of the server - client
            socket.on('ping_check', function () {
                socket.emit('pong_check');
            });
            // on client message
            socket.on('message', function (m) {
                console.log('[server](message): %s', m);
                socket.broadcast.send(m);
            });
        });
    };
    Server.prototype.eatCell = function (eaterID, eatenID) {
        console.log("Cell eaten: " + eatenID);
        //find the cell, delete it
        var eatenSize = this.cellArray[eatenID].size;
        var eaterCell = this.cellArray[eaterID];
        //remove eaten cell
        delete this.cellArray[eatenID];
        //tell the cell he's dead
        this.io.to(eatenID).emit('dead');
        var sum = Math.PI * eaterCell.size * eaterCell.size + Math.PI * eatenSize * eatenSize;
        eaterCell.size = Math.sqrt(sum / Math.PI);
    };
    Server.prototype.eatFood = function (eater, foodID) {
        console.log("Food eaten: " + foodID);
        //find the food, delete it
        var eatenSize = this.foodArray[foodID].size;
        var myCell = this.cellArray[eater];
        delete this.foodArray[foodID];
        var sum = Math.PI * myCell.size * myCell.size + Math.PI * eatenSize * eatenSize;
        myCell.size = Math.sqrt(sum / Math.PI);
        //add new Food
        this.addFood(1);
    };
    Server.prototype.checkEats = function () {
        for (var key in this.cellArray) {
            var cell = this.cellArray[key];
            //check every food, if it shall be eaten
            for (var fk in this.foodArray) {
                if (cell.eats(this.foodArray[fk])) {
                    this.eatFood(key, fk);
                }
            }
            //check every cell(except self), if it eats another cell
            for (var key2 in this.cellArray) {
                if (key2 != key && cell.eats(this.cellArray[key2])) {
                    this.eatCell(key, key2);
                }
            }
        }
    };
    Server.prototype.gameLoop = function () {
        this.checkEats();
        //convert the object to a simple value array
        var cells = [];
        for (var key in this.cellArray) {
            cells.push(this.cellArray[key]);
        }
        var food = [];
        for (var key in this.foodArray) {
            food.push(this.foodArray[key]);
        }
        this.io.sockets.emit("heartbeat", { cells: cells, food: food, viruses: this.virus });
    };
    /**
     * Sets the interval in what the loops shall be called
     *
     * @class Server
     * @method heartBeat
     */
    Server.prototype.heartBeat = function () {
        var _this = this;
        setInterval(function () {
            _this.gameLoop();
        }, 1000 / 60);
    };
    return Server;
}());
exports.Server = Server;
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
var server = Server.bootstrap();
var module;
module.exports = server.app;
