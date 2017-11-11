
gameObject = new game();

function game() {
    var that = this;
    that.playerInfos = new Array();
    that.bulletInfos = new Array();
    that.barrierInfos = new Array();

    const MOVE_UNIT = 10;
    const BOARD_HEIGHT = 200;
    const BOARD_WIDTH = 600;

    var isInitialized = false;

    that.initialize = function () {
        if (isInitialized) return;

        that.gameCanvas = document.getElementById('gameCanvas');
        that.gameCanvas.height = BOARD_HEIGHT;
        that.gameCanvas.width = BOARD_WIDTH;

        that.gameCanvasContext = gameCanvas.getContext("2d");

        that.addPlayer(new player());
        that.addPlayer(new enemy());
        that.addBarrier(new barrier('images/tree.png'), BOARD_WIDTH / 2, BOARD_HEIGHT / 2);

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

    that.addBullet = function (bullet, bulletLocationX, bulletLocationY) {
        that.bulletInfos.push({
            bullet: bullet,
            location: {
                x: bulletLocationX,
                y: bulletLocationY
            },
            image: bullet.getImage()
        });
    }
    that.addBarrier = function (barrier, barrierLocationX, barrierLocationY) {
        that.barrierInfos.push({
            barrier: barrier,
            location: {
                x: barrierLocationX,
                y: barrierLocationY
            },
            image: barrier.getImage()
        });
    }

    function refreshGameBoard() {
        that.gameCanvasContext.clearRect(0, 0, that.gameCanvas.width, that.gameCanvas.height);

        that.playerInfos.forEach(movePlayer);

        for (var i = 0; i < that.bulletInfos.length; i++) {
            moveBullet(i);
        }
        that.barrierInfos.forEach(drawObject);
    }
    function drawObject(objectInfo) {
        that.gameCanvasContext.drawImage(objectInfo.image, objectInfo.location.x, objectInfo.location.y);
    }

    function movePlayer(playerInfo) {
        var playerMove = playerInfo.player.getNextMove();

        if (playerMove.type === allowedMoves.Move)
            updatePlayerLocation(playerInfo, playerMove.direction);
        else if (playerMove.type === allowedMoves.Shoot) {
            that.addBullet(new bullet(playerMove.direction), playerInfo.location.x, playerInfo.location.y);
        }

        drawObject(playerInfo);
    }

    function moveBullet(bulletIndex) {
        var bulletInfo = that.bulletInfos[bulletIndex];
        var bulletMove = bulletInfo.bullet.getNextMove();
        var move = mapDirectionToMove(bulletMove.direction);

        bulletInfo.location.x += move.moveX * MOVE_UNIT;
        bulletInfo.location.y += move.moveY * MOVE_UNIT;

        if (bulletInfo.location.x >= BOARD_WIDTH || bulletInfo.location.y >= BOARD_HEIGHT || bulletInfo.location.x <= 0 || bulletInfo.location.y <= 0) {
            that.bulletInfos.splice(bulletIndex, 1);
        }

        drawObject(bulletInfo);
    }

    function updatePlayerLocation(playerInfo, playerDirection) {
        if (playerDirection == directions.None)
            return;

        var move = mapDirectionToMove(playerDirection);

        if (playerInfo.location.x <= MOVE_UNIT && move.moveX < 0) {
            move.moveX = 0;
        }
        if (playerInfo.location.x >= BOARD_WIDTH - MOVE_UNIT - playerInfo.image.width && move.moveX > 0) {
            move.moveX = 0;
        }
        if (playerInfo.location.y <= MOVE_UNIT && move.moveY < 0) {
            move.moveY = 0;
        }
        if (playerInfo.location.y >= BOARD_HEIGHT - MOVE_UNIT - playerInfo.image.height && move.moveY > 0) {
            move.moveY = 0;
        }

        var newPlayerLocation = {
            x: playerInfo.location.x + move.moveX * MOVE_UNIT,
            y: playerInfo.location.y + move.moveY * MOVE_UNIT
        }

        //TODO: update player location when there is no collision with any barriers or other player

        if (!detectPlayerCollision(playerInfo)) {
            playerInfo.location = newPlayerLocation;
        }
    }
    function detectPlayerCollision(playerInfo) {
        that.barrierInfos.forEach(barrierInfo => {
            if (detectCollision(playerInfo.location, { width: playerInfo.image.width, height: playerInfo.image.height }, barrierInfo.location,
                { width: barrierInfo.image.width, height: barrierInfo.image.height })) {
                return true;
            }
        });

        return false;
    }

    function detectCollision(firstObjectLocation, firstObjectSize, secondObjectLocation, secondObjectSize) {
        var first_Object_right = firstObjectLocation.x + firstObjectSize.width;
        var first_Object_left = firstObjectLocation.x;
        var first_Object_down = firstObjectLocation.y + firstObjectSize.height;
        var first_Object_top = firstObjectLocation.y;
        var sec_Object_right = firstObjectLocation.x + firstObjectSize.width;
        var sec_Object_left = firstObjectLocation.x;
        var sec_Object_down = firstObjectLocation.y + firstObjectSize.height;
        var sec_Object_top = firstObjectLocation.y;
        var collision = false;
        if (sec_Object_left > first_Object_left && sec_Object_left < first_Object_right) {
            if (sec_Object_down > first_Object_top && sec_Object_down < first_Object_down) {
                collision = true;
            }

        }
        if (sec_Object_left > first_Object_right && sec_Object_left < first_Object_left) {
            if (sec_Object_down > first_Object_top && sec_Object_down < first_Object_down) {
                collision = true;
            }

        }


        //TODO: check collision

        return collision;
    }

    function mapDirectionToMove(direction) {
        var move = { moveX: 0, moveY: 0 };

        switch (direction) {
            case directions.E:
                move.moveX = 1;
                break;
            case directions.W:
                move.moveX = -1;
                break;
            case directions.N:
                move.moveY = -1;
                break;
            case directions.S:
                move.moveY = 1;
                break;
            case directions.SE:
                move.moveX = 1;
                move.moveY = 1;
                break;
            case directions.SW:
                move.moveX = -1;
                move.moveY = 1;
                break;
            case directions.NE:
                move.moveX = 1;
                move.moveY = -1;
                break;
            case directions.NW:
                move.moveX = -1;
                move.moveY = -1;
                break;
        }

        return move;
    }

    return that;
}

function player() {
    var pressedKeys = { ArrowDown: false, ArrowLeft: false, ArrowRight: false, ArrowUp: false, Space: false };
    var faceDirection = directions.S;

    addEventListener('keydown', (event) => {
        switch (event.code) {
            case 'ArrowUp':
                pressedKeys.ArrowUp = true;
                break;
            case 'ArrowDown':
                pressedKeys.ArrowDown = true;
                break;
            case 'ArrowRight':
                pressedKeys.ArrowRight = true;
                break;
            case 'ArrowLeft':
                pressedKeys.ArrowLeft = true;
                break;
            case 'Space':
                pressedKeys.Space = true;
        }
    });
    addEventListener('keyup', (event) => {
        switch (event.code) {
            case 'ArrowUp':
                pressedKeys.ArrowUp = false;
                break;
            case 'ArrowDown':
                pressedKeys.ArrowDown = false;
                break;
            case 'ArrowRight':
                pressedKeys.ArrowRight = false;
                break;
            case 'ArrowLeft':
                pressedKeys.ArrowLeft = false;
                break;
            case 'Space':
                pressedKeys.Space = false;
        }
    });

    that = this;
    that.description = 'player';
    that.getNextMove = function () {
        console.log('Player pressed keys:' + JSON.stringify(pressedKeys));

        if (pressedKeys.Space)
            return { type: allowedMoves.Shoot, direction: faceDirection }

        var moveDirection = directions.None;
        if (pressedKeys.ArrowUp && pressedKeys.ArrowRight) {
            moveDirection = directions.NE;
        }
        else if (pressedKeys.ArrowUp && pressedKeys.ArrowLeft) {
            moveDirection = directions.NW;
        }
        else if (pressedKeys.ArrowDown && pressedKeys.ArrowRight) {
            moveDirection = directions.SE;
        }
        else if (pressedKeys.ArrowDown && pressedKeys.ArrowLeft) {
            moveDirection = directions.SW;
        }
        else if (pressedKeys.ArrowDown) {
            moveDirection = directions.S;
        }
        else if (pressedKeys.ArrowRight) {
            moveDirection = directions.E;
        }
        else if (pressedKeys.ArrowUp) {
            moveDirection = directions.N;
        }
        else if (pressedKeys.ArrowLeft) {
            moveDirection = directions.W;
        }

        if (moveDirection !== directions.None)
            faceDirection = moveDirection;

        return { type: allowedMoves.Move, direction: moveDirection };
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
        var moveDirection = directions.E;

        switch (randDirection) {
            case 0:
                moveDirection = directions.N
                break;
            case 1:
                moveDirection = directions.NE
                break;
            case 2:
                moveDirection = directions.NW
                break;
            case 3:
                moveDirection = directions.E
                break;
            case 4:
                moveDirection = directions.W
                break;
            case 5:
                moveDirection = directions.S
                break;
            case 6:
                moveDirection = directions.SE
                break;
            case 7:
                moveDirection = directions.SW
                break;
        }

        return { type: allowedMoves.Move, direction: moveDirection };
    }

    that.getImage = function () {
        var image = new Image();
        image.src = 'images/enemy.png'

        return image;
    }
}
function bullet(bulletDirection) {
    that = this;
    that.description = 'bullet';

    that.getNextMove = function () {
        return { type: allowedMoves.Move, direction: bulletDirection };
    }

    that.getImage = function () {
        var image = new Image();
        image.src = 'images/fireBullet.png'

        return image;
    }
}

function barrier(imgSrc) {
    that = this;
    that.description = 'barrier';

    that.getImage = function () {
        var image = new Image();
        image.src = imgSrc;

        return image;
    }
}

const allowedMoves = {
    Move: 'Move', Shoot: 'Shoot'
}

const directions = {
    None: 'None', N: 'N', S: 'S', W: 'W', E: 'E', SE: 'SE', SW: 'SW', NE: 'NE', NW: 'NW'
};