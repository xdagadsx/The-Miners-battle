
gameObject = new game();

function game() {
    var that = this;
    that.playerInfos = new Array();

    const MOVE_UNIT = 10;
    const BOARD_HEIGHT = 400;
    const BOARD_WIDTH = 400;

    var isInitialized = false;

    that.initialize = function () {
        if (isInitialized) return;

        that.gameCanvas = document.getElementById('gameCanvas');
        that.gameCanvas.height = BOARD_HEIGHT;
        that.gameCanvas.width = BOARD_WIDTH;

        that.gameCanvasContext = gameCanvas.getContext("2d");

        that.addPlayer(new player());
        that.addPlayer(new enemy());

        window.setInterval(refreshGameBoard, 200);

        isInitialized = true;
    }

    that.addPlayer = function (player) {
        that.playerInfos.push({
            player: player,
            location: {
                x: Math.floor((Math.random() * 10)) * 10,
                y: Math.floor((Math.random() * 10)) * 10
            },
            image: player.getImage()
        });
    }

    function refreshGameBoard() {
        that.gameCanvasContext.clearRect(0, 0, that.gameCanvas.width, that.gameCanvas.height);

        that.playerInfos.forEach(function (playerInfo) {
            updatePlayerLocation(playerInfo);

            that.gameCanvasContext.drawImage(playerInfo.image, playerInfo.location.x, playerInfo.location.y);
        }, this);
    }

    function updatePlayerLocation(playerInfo) {
        var playerMove = playerInfo.player.getNextMove();

        if (playerMove == allowedMoves.None)
            return;

        var moveX = 0, moveY = 0;

        switch (playerMove) {
            case allowedMoves.E:
                moveX = 1;
                break;
            case allowedMoves.W:
                moveX = -1;
                break;
            case allowedMoves.N:
                moveY = -1;
                break;
            case allowedMoves.S:
                moveY = 1;
                break;
            case allowedMoves.SE:
                moveX = 1;
                moveY = 1;
                break;
            case allowedMoves.SW:
                moveX = -1;
                moveY = 1;
                break;
            case allowedMoves.NE:
                moveX = 1;
                moveY = -1;
                break;
            case allowedMoves.NW:
                moveX = -1;
                moveY = -1;
                break;
        }

        if (playerInfo.location.x <= MOVE_UNIT && moveX < 0) {
            moveX = 0;
        }
        if (playerInfo.location.x >= BOARD_WIDTH - MOVE_UNIT && moveX > 0) {
            moveX = 0;
        }
        if (playerInfo.location.y <= MOVE_UNIT && moveY < 0) {
            moveY = 0;
        }
        if (playerInfo.location.y >= BOARD_HEIGHT - MOVE_UNIT && moveY > 0) {
            moveY = 0;
        }

        playerInfo.location.x += moveX * MOVE_UNIT;
        playerInfo.location.y += moveY * MOVE_UNIT;
    }

    return that;
}

function player() {
    var currentMove = allowedMoves.None;

    addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp':
                currentMove = allowedMoves.N;
                break;
            case 'ArrowDown':
                currentMove = allowedMoves.S;
                break;
            case 'ArrowRight':
                currentMove = allowedMoves.E;
                break;
            case 'ArrowLeft':
                currentMove = allowedMoves.W;
                break;
        }
    });

    that = this;
    that.description = 'player';
    that.getNextMove = function () {
        var nextMove = currentMove;
        currentMove = allowedMoves.None;
        
        return nextMove;
    }
    that.getImage = function () {
        var image = new Image();
        image.src = 'images/player.png'

        return image;
    }
}

function enemy() {
    that = this;
    that.description = 'enemy';

    that.getNextMove = function () {
        var randDirection = Math.floor((Math.random() * 10)) % 8;
        var move = allowedMoves.E;

        switch (randDirection) {
            case 0:
                move = allowedMoves.N
                break;
            case 1:
                move = allowedMoves.NE
                break;
            case 2:
                move = allowedMoves.NW
                break;
            case 3:
                move = allowedMoves.E
                break;
            case 4:
                move = allowedMoves.W
                break;
            case 5:
                move = allowedMoves.S
                break;
            case 6:
                move = allowedMoves.SE
                break;
            case 7:
                move = allowedMoves.SW
                break;
        }

        return move;
    }

    that.getImage = function () {
        var image = new Image();
        image.src = 'images/enemy.png'

        return image;
    }
}

const allowedMoves = {
    None: 'None', N: 'N', S: 'S', W: 'W', E: 'E', SE: 'SE', SW: 'SW', NE: 'NE', NW: 'NW'
};