
gameObject = new game();

function game() {
    var that = this;
    that.playerInfos = new Array();
    that.bulletInfos = new Array();
    that.barrierInfos = new Array();

    var board_height = undefined;
    var board_width = undefined;
    
    const FPS = 30;

    var isInitialized = false;

    that.initialize = function (gameConfig) {
        if (isInitialized) return;

        that.gameCanvas = gameConfig.gameCanvas;
        board_height = that.gameCanvas.height;
        board_width = that.gameCanvas.width;

        that.gameCanvasContext = that.gameCanvas.getContext("2d");

        that.addPlayer(new player());
        that.addPlayer(new enemy());
        that.addPlayer(new enemy());
        that.addPlayer(new enemy());
        that.addBarrier(new barrier('images/tree.png'), board_width / 2, board_height / 2);

        window.setInterval(refreshGameBoard, 1000/FPS);

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
        that.bulletInfos.forEach(moveBullet);
        that.barrierInfos.forEach(drawObject);

        deleteUnseenBullets();
    }

    function deleteUnseenBullets() {
        var bulletToRemoveIndexes = new Array();

        for (var i = 0; i < that.bulletInfos.length; i++) {
            var bulletInfo = that.bulletInfos[i];

            if (bulletInfo.location.x >= board_width || bulletInfo.location.y >= board_height || bulletInfo.location.x <= 0 || bulletInfo.location.y <= 0) {
                bulletToRemoveIndexes.push(i);
            }
        }

        bulletToRemoveIndexes.forEach(index => that.bulletInfos.splice(index, 1));
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

    function moveBullet(bulletInfo) {
        var bulletMove = bulletInfo.bullet.getNextMove();
        var move = mapDirectionToMove(bulletMove.direction);
        var bulletMoveUnit = bulletInfo.bullet.speed / FPS;

        bulletInfo.location.x += move.moveX * bulletMoveUnit;
        bulletInfo.location.y += move.moveY * bulletMoveUnit;

        drawObject(bulletInfo);
    }

    function updatePlayerLocation(playerInfo, playerDirection) {
        if (playerDirection == directions.None)
            return;

        var move = mapDirectionToMove(playerDirection);
        var playerMoveUnit = playerInfo.player.speed / FPS;

        if (playerInfo.location.x <= playerMoveUnit && move.moveX < 0) {
            move.moveX = 0;
        }
        if (playerInfo.location.x >= board_width - playerMoveUnit - playerInfo.image.width && move.moveX > 0) {
            move.moveX = 0;
        }
        if (playerInfo.location.y <= playerMoveUnit && move.moveY < 0) {
            move.moveY = 0;
        }
        if (playerInfo.location.y >= board_height - playerMoveUnit - playerInfo.image.height && move.moveY > 0) {
            move.moveY = 0;
        }

        var newPlayerLocation = {
            x: playerInfo.location.x + move.moveX * playerMoveUnit,
            y: playerInfo.location.y + move.moveY * playerMoveUnit
        }
        var oldPlayerLocation = playerInfo.location;
        playerInfo.location = newPlayerLocation;

        if (detectPlayerCollision(playerInfo)) {
            playerInfo.location = oldPlayerLocation;
        }
    }

    function detectPlayerCollision(playerInfo) {
        //TODO: Improve performance, after first conflict detected stop future processing
        var collisionDetected = false;

        that.barrierInfos.forEach(barrierInfo => {
            if (detectCollision(playerInfo.location, { width: playerInfo.image.width, height: playerInfo.image.height }, barrierInfo.location,
                { width: barrierInfo.image.width, height: barrierInfo.image.height })) {
                collisionDetected = true;
            }
        });

        that.playerInfos.forEach(pi => {
            if(pi === playerInfo)
                return;

            if (detectCollision(playerInfo.location, { width: playerInfo.image.width, height: playerInfo.image.height },
                 pi.location, { width: pi.image.width, height: pi.image.height })) {
                collisionDetected = true;
            }
        });

        return collisionDetected;
    }

    function detectCollision(firstObjectLocation, firstObjectSize, secondObjectLocation, secondObjectSize) {
        var x1_end = firstObjectLocation.x + firstObjectSize.width;
        var x1_start = firstObjectLocation.x;
        var y1_end = firstObjectLocation.y + firstObjectSize.height;
        var y1_start = firstObjectLocation.y;
        var x2_end = secondObjectLocation.x + secondObjectSize.width;
        var x2_start = secondObjectLocation.x;
        var y2_end = secondObjectLocation.y + secondObjectSize.height;
        var y2_start = secondObjectLocation.y;

        function isInRange(number, rangeStart, rangeEnd) {
            return number <= rangeEnd && number >= rangeStart;
        }

        var xColliding = isInRange(x2_start, x1_start, x1_end) || isInRange(x2_end, x1_start, x1_end) || isInRange(x1_start, x2_start, x2_end) || isInRange(x1_end, x2_start, x2_end);
        var yColliding = isInRange(y2_start, y1_start, y1_end) || isInRange(y2_end, y1_start, y1_end) || isInRange(y1_start, y2_start, y2_end) || isInRange(y1_end, y2_start, y2_end);

        return xColliding && yColliding;
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
    that.speed = 40;
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
    const NUMBER_OF_REPLAYS = 8;
    var numberOfMoveReplays = NUMBER_OF_REPLAYS;
    var currentMoveDirection = directions.None;

    that = this;
    that.description = 'enemy';
    that.speed = 40;
    that.getNextMove = function () {
        if (--numberOfMoveReplays > 0) {
            return { type: allowedMoves.Move, direction: currentMoveDirection };
        }

        numberOfMoveReplays = NUMBER_OF_REPLAYS;
        var randDirection = Math.floor((Math.random() * 10)) % 10;

        switch (randDirection) {
            case 0:
                currentMoveDirection = directions.N
                break;
            case 1:
                currentMoveDirection = directions.NE
                break;
            case 2:
                currentMoveDirection = directions.NW
                break;
            case 3:
                currentMoveDirection = directions.E
                break;
            case 4:
                currentMoveDirection = directions.W
                break;
            case 5:
                currentMoveDirection = directions.S
                break;
            case 6:
                currentMoveDirection = directions.SE
                break;
            case 7:
                currentMoveDirection = directions.SW
                break;
            case 8:
                currentMoveDirection = directions.None
                break;
            case 9:
                if (currentMoveDirection !== directions.None) {
                    return { type: allowedMoves.Shoot, direction: currentMoveDirection };
                }
        }

        return { type: allowedMoves.Move, direction: currentMoveDirection };
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
    that.speed = 60;
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