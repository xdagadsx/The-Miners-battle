//@ts-check
// @ts-ignore
gameObject = new game();

var collisionDetectionUtils = (function () {
    var that = {};
    that.getObjectCoordinates = function (objectLocation, objectImage, checkingRestrictions) {
        checkingRestrictions = checkingRestrictions || { offsetX: 0, offsetY: 0 };
        checkingRestrictions.offsetX = checkingRestrictions.offsetX || 0;
        checkingRestrictions.offsetY = checkingRestrictions.offsetY || 0;

        return {
            x_start: objectLocation.x + checkingRestrictions.offsetX,
            x_end: objectLocation.x + objectImage.width,
            y_start: objectLocation.y + checkingRestrictions.offsetY,
            y_end: objectLocation.y + objectImage.height
        }
    }

    return that;
})();

function rectangleBaseCollisionDetector() {

    this.detectCollision = function (firstObjectLocation, firstObjectImage, secondObjectLocation, secondObjectImage, firstObjectCheckingRestrictions, secondObjectCheckingRestrictions) {
        var o1 = collisionDetectionUtils.getObjectCoordinates(firstObjectLocation, firstObjectImage, firstObjectCheckingRestrictions);
        var o2 = collisionDetectionUtils.getObjectCoordinates(secondObjectLocation, secondObjectImage, secondObjectCheckingRestrictions);

        function isInRange(number, rangeStart, rangeEnd) {
            return number <= rangeEnd && number >= rangeStart;
        }

        var xColliding = isInRange(o2.x_start, o1.x_start, o1.x_end) || isInRange(o2.x_end, o1.x_start, o1.x_end) || isInRange(o1.x_start, o2.x_start, o2.x_end) || isInRange(o1.x_end, o2.x_start, o2.x_end);
        var yColliding = isInRange(o2.y_start, o1.y_start, o1.y_end) || isInRange(o2.y_end, o1.y_start, o1.y_end) || isInRange(o1.y_start, o2.y_start, o2.y_end) || isInRange(o1.y_end, o2.y_start, o2.y_end);

        return xColliding && yColliding;
    }
}

function colorBaseCollisionDetector() {
    var rectanglesCollisionDetector = new rectangleBaseCollisionDetector();
    var testingCanvas = document.createElement('canvas');
    var testingCanvasContext = testingCanvas.getContext('2d');
    var imagesColorsCache = {};

    this.detectCollision = function (firstObjectLocation, firstObjectImage, secondObjectLocation, secondObjectImage, firstObjectCheckingRestrictions, secondObjectCheckingRestrictions) {
        if (!rectanglesCollisionDetector.detectCollision(firstObjectLocation, firstObjectImage, secondObjectLocation, secondObjectImage, firstObjectCheckingRestrictions, secondObjectCheckingRestrictions))
            return false;

        if (!imagesColorsCache[firstObjectImage.src])
            addImageDataToCache(firstObjectImage);
        if (!imagesColorsCache[secondObjectImage.src])
            addImageDataToCache(secondObjectImage);


        //use locations and image sizes to get conflicting parts of images
        var o1 = collisionDetectionUtils.getObjectCoordinates(firstObjectLocation, firstObjectImage, firstObjectCheckingRestrictions);
        var o2 = collisionDetectionUtils.getObjectCoordinates(secondObjectLocation, secondObjectImage, secondObjectCheckingRestrictions);

        function isInRange(number, rangeStart, rangeEnd) {
            return number <= rangeEnd && number >= rangeStart;
        }

        var commonX = new Array();
        var commonY = new Array();

        //find location of points when images rectangles are crossed
        if (isInRange(o2.x_start, o1.x_start, o1.x_end))
            commonX.push(o2.x_start);
        if (isInRange(o2.x_end, o1.x_start, o1.x_end))
            commonX.push(o2.x_end);
        if (isInRange(o1.x_start, o2.x_start, o2.x_end))
            commonX.push(o1.x_start);
        if (isInRange(o1.x_end, o2.x_start, o2.x_end))
            commonX.push(o1.x_end);

        if (isInRange(o2.y_start, o1.y_start, o1.y_end))
            commonY.push(o2.y_start);
        if (isInRange(o2.y_end, o1.y_start, o1.y_end))
            commonY.push(o2.y_end);
        if (isInRange(o1.y_start, o2.y_start, o2.y_end))
            commonY.push(o1.y_start);
        if (isInRange(o1.y_end, o2.y_start, o2.y_end))
            commonY.push(o1.y_end);

        //compare color data from that conflicting rectangle and check if there are at least one color pixel on same location
        commonX.sort((a, b) => (a - b)); //By default sorting using text representation, so 100 < 8 !!!
        commonY.sort((a, b) => (a - b));

        var commonX_start = commonX[0];
        var commonX_end = commonX[commonX.length - 1]; //when two objects have same x or y, then array contain duplicates!
        var commonY_start = commonY[0];
        var commonY_end = commonY[commonY.length - 1];

        var firstImageXConflictStart = commonX_start - firstObjectLocation.x;
        var firstImageYConflictStart = commonY_start - firstObjectLocation.y;

        var secondImageXConflictStart = commonX_start - secondObjectLocation.x;
        var secondImageYConflictStart = commonY_start - secondObjectLocation.y;

        //once we know what part of image is conflicting, we can grab image data and check for conflict
        var commonXLineLength = commonX_end - commonX_start;
        var commonYLineLength = commonY_end - commonY_start;

        var firstImageAlphas = imagesColorsCache[firstObjectImage.src];
        var secondImageAlphas = imagesColorsCache[secondObjectImage.src];
        for (var i = 0; i < commonXLineLength; ++i) {
            for (var j = 0; j < commonYLineLength; ++j) {
                if (firstImageAlphas[i + firstImageXConflictStart][j + firstImageYConflictStart] &&
                    secondImageAlphas[i + secondImageXConflictStart][j + secondImageYConflictStart])
                    return true;
            }
        }

        return false;
    }

    function addImageDataToCache(image) {
        testingCanvasContext.drawImage(image, 0, 0);
        var imageData = testingCanvasContext.getImageData(0, 0, image.width, image.height);
        imagesColorsCache[image.src] = new Array(imageData.width);

        for (var i = 0; i < imageData.width; ++i) {
            var yValues = new Array(imageData.height);
            imagesColorsCache[image.src][i] = yValues;
            for (var j = 0; j < imageData.height; ++j) {
                var shiftToNextLine = j * imageData.width * 4;
                yValues[j] = imageData.data[i * 4 + shiftToNextLine + 3] > 0;//getting alpha color from pixel values and setting flag indicating if this pixel is not transparent
            }
        }

        testingCanvasContext.clearRect(0, 0, testingCanvas.width, testingCanvas.height);
    }
}

function game() {
    var rectanglesCollisionDetector = new rectangleBaseCollisionDetector();
    var colorsCollisionDetector = new colorBaseCollisionDetector();

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

        isInitialized = true;

        loadAllNeededImages().then(() => {
            that.gameConfig = gameConfig;
            that.gameCanvas = gameConfig.gameCanvas;
            board_height = that.gameCanvas.height;
            board_width = that.gameCanvas.width;

            that.gameCanvasContext = that.gameCanvas.getContext("2d");

            that.addPlayer(new player());
            that.addPlayer(new enemy());
            that.addPlayer(new enemy());
            that.addPlayer(new enemy());
            that.addBarrier(new barrier(imageTypes.Rock));
            that.addBarrier(new barrier(imageTypes.Rock));
            that.addBarrier(new barrier(imageTypes.Rock));
            that.addBarrier(new barrier(imageTypes.Rock));

            window.setInterval(updateGame, 1000 / FPS);

            that.gameConfig.onGameInitialized(that.playerInfos.map(pi => pi.player));
        });
    }

    that.addPlayer = function (player) {
        var image = player.getImage();

        that.playerInfos.push({
            player: player,
            location: getLocationWithoutCollision(image, player.dimensions),
            image: image,
            dimensions: player.dimensions
        });
    }

    that.addBullet = function (bullet, bulletLocation) {
        that.bulletInfos.push({
            bullet: bullet,
            location: bulletLocation,
            image: bullet.getImage(),
            dimensions: bullet.dimensions
        });
    }
    that.addBarrier = function (barrier) {
        var image = barrier.getImage();
        that.barrierInfos.push({
            barrier: barrier,
            location: getLocationWithoutCollision(image, barrier.dimensions),
            image: image,
            dimensions: barrier.dimensions
        });
    }

    function loadAllNeededImages() {
        var allImagesLoaded = new Promise((resolve, reject) => {
            var imagesCount = 0;
            var loadedImagesCount = 0;

            for (var imageKey in imageTypes) {
                ++imagesCount;
            }

            for (var imageKey in imageTypes) {
                var img = new Image();
                img.onload = () => {
                    ++loadedImagesCount;
                    if (imagesCount == loadedImagesCount)
                        resolve();
                };
                img.src = imageTypes[imageKey].src;
            }
        });

        return allImagesLoaded;
    }

    function getLocationWithoutCollision(image, objectDimensions) {
        //TODO: stop when it is not possible to find correct location!
        var correctLocation = false;
        var newLocation = undefined;

        function entireObjectIsOnBoard(location, size) {
            return location.x >= 0 && location.y >= 0 &&
                location.x + size.width <= board_width && location.y + size.height <= board_height
        }

        do {
            newLocation = {
                x: Math.floor((Math.random() * board_width)),
                y: Math.floor((Math.random() * board_height)),
                z: 0
            }
            newLocation.z = newLocation.y + objectDimensions.height - objectDimensions.thickness;

            var allObjectsOnBoard = that.barrierInfos.concat(that.playerInfos).concat(that.bulletInfos);
            var collisionDetected = detectObjectCollision({ location: newLocation, image: image, dimensions: objectDimensions }, allObjectsOnBoard);
            var objectIsOnBoard = entireObjectIsOnBoard(newLocation, image);

            correctLocation = !collisionDetected && objectIsOnBoard;
        } while (!correctLocation)

        return newLocation;
    }

    function updateGame() {
        //players can produce bullets, so they need to move first
        that.playerInfos.forEach(movePlayer);
        that.bulletInfos.forEach(moveBullet);

        var playersStateChanged = false;
        //check player collisions with bullets and update health
        for (var i = 0; i < that.playerInfos.length; ++i) {
            var playerInfo = that.playerInfos[i];

            for (var j = 0; j < that.bulletInfos.length; ++j) {
                var bulletInfo = that.bulletInfos[j];
                if (colorsCollisionDetector.detectCollision(playerInfo.location, playerInfo.image, bulletInfo.location, bulletInfo.image, getCollisionRestriction(playerInfo), getCollisionRestriction(bulletInfo))) {
                    playerInfo.player.hp -= bulletInfo.bullet.damage;
                    bulletInfo.toRemove = true;

                    playersStateChanged = true;
                }
            }
        }

        deleteNotNeededBullets();
        that.playerInfos = that.playerInfos.filter(pi => pi.player.hp > 0);

        redrawMap();

        if (playersStateChanged)
            that.gameConfig.onPlayersUpdated(that.playerInfos.map(pi => pi.player));
    }

    function redrawMap() {
        that.gameCanvasContext.clearRect(0, 0, that.gameCanvas.width, that.gameCanvas.height);

        that.bulletInfos
            .concat(that.playerInfos)
            .concat(that.barrierInfos)
            .sort((o1, o2) => o1.location.z - o2.location.z)
            .forEach(objectInfo => drawObject(objectInfo));
    }

    function deleteNotNeededBullets() {
        var bulletToRemoveIndexes = new Array();

        for (var i = 0; i < that.bulletInfos.length; i++) {
            var bulletInfo = that.bulletInfos[i];

            if (bulletInfo.toRemove || bulletInfo.location.x >= board_width || bulletInfo.location.y >= board_height || bulletInfo.location.x <= 0 || bulletInfo.location.y <= 0) {
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
            var bulletToBeShooted = new bullet(playerMove.direction);
            var bulletImage = bulletToBeShooted.getImage();

            var bulletMove = mapDirectionToMove(playerMove.direction);

            var bulletStartLocation = { x: playerInfo.location.x, y: playerInfo.location.y };
            if (bulletMove.moveX === 1) {
                bulletStartLocation.x += playerInfo.image.width + 1;
            } else if (bulletMove.moveX === 0) {
                bulletStartLocation.x += (playerInfo.image.width - bulletImage.width) / 2;
            } else if (bulletMove.moveX === -1) {
                bulletStartLocation.x -= bulletImage.width + 1;
            }

            if (bulletMove.moveY === 1) {
                bulletStartLocation.y += playerInfo.image.height + 1;
            } else if (bulletMove.moveY === 0) {
                bulletStartLocation.y += (playerInfo.image.height - bulletImage.height) / 2;
            } else if (bulletMove.moveY === -1) {
                bulletStartLocation.y -= bulletImage.height + 1;
            }

            bulletStartLocation.z = bulletStartLocation.y + bulletToBeShooted.dimensions.height - bulletToBeShooted.dimensions.thickness;
            that.addBullet(bulletToBeShooted, bulletStartLocation);
        }
    }

    function moveBullet(bulletInfo) {
        var bulletMove = bulletInfo.bullet.getNextMove();
        var move = mapDirectionToMove(bulletMove.direction);
        var bulletMoveUnit = Math.round(bulletInfo.bullet.speed / FPS);

        bulletInfo.location.x += move.moveX * bulletMoveUnit;
        bulletInfo.location.y += move.moveY * bulletMoveUnit;
    }

    function updatePlayerLocation(playerInfo, playerDirection) {
        if (playerDirection == directions.None)
            return;

        var move = mapDirectionToMove(playerDirection);
        var player = playerInfo.player;
        var playerMoveUnit = player.speed / FPS;

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
            x: playerInfo.location.x + Math.round(move.moveX * playerMoveUnit),
            y: playerInfo.location.y + Math.round(move.moveY * playerMoveUnit)
        }
        newPlayerLocation.z = newPlayerLocation.y + player.dimensions.height - player.dimensions.thickness;

        var oldPlayerLocation = playerInfo.location;
        playerInfo.location = newPlayerLocation;

        if (detectObjectCollision(playerInfo, that.barrierInfos.concat(that.playerInfos.filter(pi => pi !== playerInfo)))) {
            playerInfo.location = oldPlayerLocation;
        }
    }
    function getCollisionRestriction(objectInfo) {
        return { offsetY: objectInfo.dimensions.height - objectInfo.dimensions.thickness };
    };

    function detectObjectCollision(objectInfo, objectInfosToCheck) {
        return objectInfosToCheck.some(o => colorsCollisionDetector
            .detectCollision(objectInfo.location, objectInfo.image, o.location, o.image, getCollisionRestriction(objectInfo), getCollisionRestriction(o)));
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
}

function player() {
    const imageType = imageTypes.Player;

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
        }
    });

    var that = this;
    that.identifier = 'player';
    that.hp = 400;
    that.speed = 40;
    that.dimensions = getImageTypeDimensions(imageType);
    that.getNextMove = function () {
        if (pressedKeys.Space) {
            pressedKeys.Space = false;
            return { type: allowedMoves.Shoot, direction: faceDirection }
        }

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
        image.src = imageType.src;

        return image;
    }
}

var enemyId = 1;
function enemy() {
    const imageType = imageTypes.Enemy;
    const NUMBER_OF_REPLAYS = 8;
    var numberOfMoveReplays = NUMBER_OF_REPLAYS;
    var currentMoveDirection = directions.None;

    var that = this;
    that.identifier = 'enemy_' + enemyId++;
    that.speed = 40;
    that.hp = 100;
    that.dimensions = getImageTypeDimensions(imageType);
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
        image.src = imageType.src;

        return image;
    }
}

function bullet(bulletDirection) {
    const imageType = imageTypes.FireBullet;
    var that = this;
    that.description = 'bullet';
    that.speed = 60;
    that.damage = 40;
    that.dimensions = getImageTypeDimensions(imageType);
    that.getNextMove = function () {
        return { type: allowedMoves.Move, direction: bulletDirection };
    }

    var image = new Image();
    image.src = imageType.src;
    that.getImage = function () {
        return image;
    }
}

function barrier(imageType) {
    var that = this;
    that.description = 'barrier';
    that.dimensions = getImageTypeDimensions(imageType);

    that.getImage = function () {
        var image = new Image();
        image.src = imageType.src;

        return image;
    }
}

function getImageTypeDimensions(imageType) {
    return { width: imageType.width, height: imageType.height, thickness: imageType.thickness };
}

const allowedMoves = {
    Move: 'Move', Shoot: 'Shoot'
}

const directions = {
    None: 'None', N: 'N', S: 'S', W: 'W', E: 'E', SE: 'SE', SW: 'SW', NE: 'NE', NW: 'NW'
};

const imageTypes = {
    Player: { src: 'images/player.png', width: 30, height: 30, thickness: 10 },
    Enemy: { src: 'images/enemy.png', width: 30, height: 30, thickness: 10 },
    FireBullet: { src: 'images/fireBullet.png', width: 20, height: 20, thickness: 10 },
    Rock: { src: 'images/rock.png', width: 120, height: 83, thickness: 30 },
    Tree: { src: 'images/tree.png', width: 50, height: 50, thickness: 16 }
};