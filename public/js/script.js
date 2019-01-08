/*
 * http://www.andreas-hahn.at
 *
 * Agar.io Client
 *
 * by Hahn Andreas
 *
 */

"use strict";

var agario = agario || {};

agario.module = (function ($) {
    var socket = {};
    var pingStartTime;
    var canvas, ctx;
    var username, color;

    var cells, food;
    var mySize = 64;
    var myCell;
    var myID;

    var mousePos;

    var zoom = 1;

    function joinServer() {


        if (!socket.connected) {
            connectSocket();

            startGame();
        }
    }

    function keyUpHandler(e) {
        var keyCode = e.keyCode;

        switch (keyCode) {
            case 77: // 77 -- m
                $('#menu').foundation('toggle');
                break;
            case 70: //70 -- f
                socket.emit("sprint");
                break;
            case 80: //70 -- p
                pingStartTime = Date.now();
                socket.emit("ping_check");
                break;
            default:
                console.log(keyCode);
                break;
        }
    }

    function mouseMovement(event) {
        // retrieve the current x and y coordinates from the mouse on the canvas
        mousePos = getMousePos(canvas, event);
    }

    function printMessage(data) {

        $('#messages').append(data.toString());
    }


    //-----------INIT--------------//
    function init() {
        canvas = document.getElementById('field');
        ctx = canvas.getContext('2d');

        mousePos = [];
        mousePos.x = 0;
        mousePos.y = 0;

        $('#join').click(joinServer);
        $('#disconnect').click(disconnectSocket);


        //init cells
        cells = [];
        //init food
        food = [];


    }

    function connectSocket() {
        username = $("#username").val();
        //if no name is given, set standard name
        username = (username !== undefined) ? username : "client";
        color = $("#color").val();
        color = (color !== undefined) ? color : "#00ff00";

        // this ip adress
        // socket = io.connect("http://192.168.1.1:9991/", {query: "name=" + username});
        socket = io.connect("http://localhost:9991/", {query: "name=" + username});

        socketHandlers()


    }

    function startGame() {

        //register key listeners
        document.addEventListener("keyup", keyUpHandler, false);
        document.addEventListener("mousemove", mouseMovement, false);
        canvasConfig();
        // show canvas
        $(".login-container").addClass("hide");
        $(".game-container").removeClass("hide");

        var data = {"color": color};
        socket.emit("start", data);
    }

    function socketHandlers() {
        socket.on("message", printMessage);
        socket.on("heartbeat", heartBeat);
        socket.on("dead", dead);
        socket.on("gameSetup", gameSetup);
        socket.on("pong_check", pong);

        //error on connect
        socket.on('connect_error', function () {
            if (typeof console !== "undefined" && console !== null) {
                console.log("Connect failed (port 9991)");
            }
        });
    }

    function gameSetup(data) {
        myCell = new Cell(data.pos.x, data.pos.y, data.size, ctx, data.color);

        //start rendering the game after connection is here
        render();
    }

    function canvasConfig() {
        //make canvas full size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // function initVirus() {
    //     for (var i = 0; i < 500; i++) {
    //         var x = random(-canvas.width, canvas.width);
    //         var y = random(-canvas.height, canvas.height);
    //         var food = new Cell(i, x, y, 16, ctx);
    //         food.color = "red";
    //         virus.push(food);
    //     }
    // }

    function render() {

        if (socket.connected) {
            eraseCanvas(canvas, ctx);


            //translate,zoom canvas
            respondCanvas();

            var mouseVector = new Vector(mousePos.x, mousePos.y);

            //send the server my pos
            var data = {
                mouseVector: mouseVector.toObject()
            };

            socket.emit("update", data);

            displayFood();
            displayCells();
        }
        requestAnimationFrame(render);

    }

    function respondCanvas() {
        ctx.translate(canvas.width / 2, canvas.height / 2);   //translate origin to center
        var newZoom = mySize / myCell.size;
        zoom = lerp(zoom, newZoom, 0.1);
        ctx.scale(zoom, zoom); //scale to respond to size
        ctx.translate(-myCell.pos.x, -myCell.pos.y);
    }


    function heartBeat(data) {
        cells = data.cells; // update cells
        food = data.food; // update food
    }

    function dead() {
        $("body").css("backgroundColor", "red");
        disconnectSocket();
        location.reload();
    }

    function pong() {
        var latency = Date.now() - pingStartTime;
        $("#ping").html(latency);
        console.log("Ping: %sms", latency);
    }

    function disconnectSocket() {

        socket.disconnect();

        //remove key listeners
        document.removeEventListener("keyup", keyUpHandler, false);
        //hide canvas
        $(".game-container").addClass("hide");
        $(".login-container").removeClass("hide");
    }


    function displayCells() {

        //display yourself first --> below others
        myCell.display();

        //cells
        for (var i = cells.length - 1; i >= 0; i--) {

            if (cells[i].id !== socket.id) {

                var player_cell = new Cell(cells[i].pos.x, cells[i].pos.y, cells[i].size, ctx, cells[i].color);
                player_cell.display();

                //show Cell
                ctx.beginPath();
                ctx.strokeStyle = 'white';
                ctx.fillStyle = cells[i].color;
                ctx.lineWidth = 1;
                //show Name
                var fontSize = 20 / zoom;
                ctx.font = Math.round(fontSize) + "px Arial";
                ctx.textAlign = "center";
                ctx.fillText(cells[i].name, cells[i].pos.x, cells[i].pos.y + cells[i].size + 30);
                ctx.strokeText(cells[i].name, cells[i].pos.x, cells[i].pos.y + cells[i].size + 30);

            } else {

                //update myCell
                myCell.pos.x = cells[i].pos.x;
                myCell.pos.y = cells[i].pos.y;
                myCell.size = cells[i].size;
            }
        }
    }

    function displayFood() {
        for (var i = food.length - 1; i >= 0; i--) {
            var food_cell = new Cell(food[i].pos.x, food[i].pos.y, food[i].size, ctx, food[i].color);
            food_cell.display();
        }
    }

    //document ready shorthand :) -fancy
    $(init);


    // public
    return {};

}($));


function getMousePos(canvas, evt) {

    //rect: the offset from the canvas element relative to the windows borders.
    var rect = canvas.getBoundingClientRect();

    return {
        x: evt.clientX - canvas.width / 2 - rect.left,
        y: evt.clientY - canvas.height / 2 - rect.top
    };
}

function eraseCanvas(canvas, ctx) {
    //TODO: what is better?
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = canvas.width;
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function lerp(A, B, t) {
    return A + t * (B - A);
}