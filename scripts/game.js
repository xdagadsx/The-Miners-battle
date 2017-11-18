gameObject = new game();

function game() {
    "use strict";

    //import all dependencies from other files
    var collisionDetector = window.GAME.collisionDetector;
    var player = window.GAME.player;
    var enemy = window.GAME.enemy;
    var barrier = window.GAME.barrier;
    var bullet = window.GAME.bullet;
    var imageTypes = window.GAME.imageTypes;
    var allowedMoves = window.GAME.allowedMoves;
    var directions = window.GAME.directions;

    var userPlayerInfo = undefined;
    var playerInfos = new Array();
    var bulletInfos = new Array();
    var barrierInfos = new Array();

    var gameConfig = undefined;
    var gameCanvas = undefined;
    var gameCanvasContext = undefined;

    var board_height = undefined;
    var board_width = undefined;
    const FPS = 30;

    var isInitialized = false;

    var that = this;
    that.initialize = function (config) {
        if (isInitialized) return;

        isInitialized = true;

        loadAllNeededImages().then(() => {
            gameConfig = config;
            gameCanvas = config.gameCanvas;
            board_height = gameCanvas.height;
            board_width = gameCanvas.width;

            gameCanvasContext = gameCanvas.getContext("2d");

            var userPlayer = new player();
            userPlayerInfo = {
                player: userPlayer,
                location: {
                    x: Math.floor(board_width / 2),
                    y: Math.floor(board_height / 2),
                    z: Math.floor(board_height / 2) + userPlayer.dimensions.height - userPlayer.dimensions.thickness
                },
                image: userPlayer.getImage(),
                dimensions: userPlayer.dimensions,
                gameObject: userPlayer
            };
            playerInfos.push(userPlayerInfo);

            that.addPlayer(new enemy());
            that.addPlayer(new enemy());
            that.addPlayer(new enemy());
            that.addBarrier(new barrier(imageTypes.Rock));
            that.addBarrier(new barrier(imageTypes.Rock));
            that.addBarrier(new barrier(imageTypes.Rock));
            that.addBarrier(new barrier(imageTypes.Rock));

            window.setInterval(updateGame, 1000 / FPS);

            gameConfig.onGameInitialized(playerInfos.map(pi => pi.player));
        });
    }

    that.addPlayer = function (player) {
        var image = player.getImage();

        playerInfos.push({
            player: player,
            location: getLocationWithoutCollision(image, player.dimensions),
            image: image,
            dimensions: player.dimensions,
            gameObject: player
        });
    }

    function addBullet(bullet, bulletLocation) {
        bulletInfos.push({
            bullet: bullet,
            location: bulletLocation,
            image: bullet.getImage(),
            dimensions: bullet.dimensions,
            gameObject: bullet
        });
    }
    that.addBarrier = function (barrier) {
        var image = barrier.getImage();
        barrierInfos.push({
            barrier: barrier,
            location: getLocationWithoutCollision(image, barrier.dimensions),
            image: image,
            dimensions: barrier.dimensions,
            gameObject: barrier
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

            var allObjectsOnBoard = barrierInfos.concat(playerInfos, bulletInfos);
            var collisionDetected = detectObjectCollision({ location: newLocation, image: image, dimensions: objectDimensions }, allObjectsOnBoard);
            var objectIsOnBoard = entireObjectIsOnBoard(newLocation, image);

            correctLocation = !collisionDetected && objectIsOnBoard;
        } while (!correctLocation)

        return newLocation;
    }

    function updateGame() {
        movePlayer();
        bulletInfos.forEach(moveBullet);
        playerInfos.filter(pi => pi != userPlayerInfo).forEach(moveBot);

        //check player collisions with bullets and update health
        var playersStateChanged = checkCollisionsWithBullets(playerInfos.concat(barrierInfos));

        deleteNotNeededBullets();
        //deleteAllNotReachableObjects();
        playerInfos = playerInfos.filter(pi => pi.player.hp > 0);

        redrawVisibleObjectsOnMap();

        if (playersStateChanged)
            gameConfig.onPlayersUpdated(playerInfos.map(pi => pi.player));
    }

    function checkCollisionsWithBullets(objectInfos) {
        var playersStateChanged = false;

        for (var objectInfo of objectInfos) {
            for (var j = 0; j < bulletInfos.length; ++j) {
                var bulletInfo = bulletInfos[j];
                if (collisionDetector.detectCollision(objectInfo.location, objectInfo.image, bulletInfo.location, bulletInfo.image, getCollisionRestriction(objectInfo), getCollisionRestriction(bulletInfo))) {
                    objectInfo.gameObject.hp -= bulletInfo.bullet.damage;
                    bulletInfo.toRemove = true;

                    playersStateChanged = true;
                }
            }
        }

        return playersStateChanged;
    }

    function redrawVisibleObjectsOnMap() {
        gameCanvasContext.clearRect(0, 0, board_width, board_height);

        bulletInfos
            .concat(playerInfos, barrierInfos)
            .filter(objectInfo => !isOutsideOfVisibleMap(objectInfo.location, objectInfo.dimensions))
            .sort((o1, o2) => o1.location.z - o2.location.z)
            .forEach(objectInfo => drawObject(objectInfo));
    }

    function deleteNotNeededBullets() {
        var bulletToRemoveIndexes = new Array();

        for (var i = 0; i < bulletInfos.length; i++) {
            var bulletInfo = bulletInfos[i];

            if (bulletInfo.toRemove || isOutsideOfReachableMap(bulletInfo.location)) {
                bulletToRemoveIndexes.push(i);
            }
        }

        bulletToRemoveIndexes.forEach(index => bulletInfos.splice(index, 1));
    }

    const maximumDistanceFromVisibleMap = 200;
    const maxX = board_width + maximumDistanceFromVisibleMap;
    const maxY = board_height + maximumDistanceFromVisibleMap;
    
    function isOutsideOfReachableMap(location){
        return location.x >= maxX || location.y >= maxY || location.x <= -maximumDistanceFromVisibleMap || location.y <= -maximumDistanceFromVisibleMap;
    }

    function isOutsideOfVisibleMap(location, dimensions){
        return location.x >= board_width || location.y >= board_height || location.x + dimensions.width <= 0 || location.y + dimensions.height <= 0;
    }

    function drawObject(objectInfo) {
        gameCanvasContext.drawImage(objectInfo.image, objectInfo.location.x, objectInfo.location.y);
    }

    function movePlayer() {
        var playerMove = userPlayerInfo.player.getNextMove();

        if (playerMove.type === allowedMoves.Move && playerMove.direction !== directions.None) {
            //get location delta from player move and subtract it from each object location
            var move = mapDirectionToMove(playerMove.direction);

            var playerMoveUnit = Math.round(userPlayerInfo.player.speed / FPS);
            var locationDelta = { x: move.moveX * playerMoveUnit, y: move.moveY * playerMoveUnit, z: move.moveY * playerMoveUnit };

            var currentPlayerLocation = userPlayerInfo.location;
            //update player location only for collision detection
            userPlayerInfo.location = {
                x: currentPlayerLocation.x + locationDelta.x,
                y: currentPlayerLocation.y + locationDelta.y,
                z: currentPlayerLocation.z + locationDelta.z
            };

            if (!detectObjectCollision(userPlayerInfo, barrierInfos.concat(playerInfos.filter(pi => pi !== userPlayerInfo)))) {
                playerInfos.filter(pi => pi != userPlayerInfo).concat(barrierInfos, bulletInfos).forEach(objectInfo => {
                    objectInfo.location.x -= locationDelta.x;
                    objectInfo.location.y -= locationDelta.y;
                    objectInfo.location.z -= locationDelta.z;
                });
            }

            //reset player location to previous value
            userPlayerInfo.location = currentPlayerLocation;
        }
        else if (playerMove.type === allowedMoves.Shoot)
            shootBullet(userPlayerInfo, playerMove.direction);
    }

    function moveBot(playerInfo) {
        var playerMove = playerInfo.player.getNextMove();

        if (playerMove.type === allowedMoves.Move)
            updatePlayerLocation(playerInfo, playerMove.direction);
        else if (playerMove.type === allowedMoves.Shoot)
            shootBullet(playerInfo, playerMove.direction);
    }

    function moveBullet(bulletInfo) {
        var bulletMove = bulletInfo.bullet.getNextMove();
        var move = mapDirectionToMove(bulletMove.direction);
        var bulletMoveUnit = Math.round(bulletInfo.bullet.speed / FPS);

        bulletInfo.location.x += move.moveX * bulletMoveUnit;
        bulletInfo.location.y += move.moveY * bulletMoveUnit;
    }

    function shootBullet(playerInfo, bulletDirection) {
        var bulletToBeShooted = new bullet(bulletDirection);
        var bulletImage = bulletToBeShooted.getImage();

        var bulletMove = mapDirectionToMove(bulletDirection);

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
        addBullet(bulletToBeShooted, bulletStartLocation);
    }
    function updatePlayerLocation(playerInfo, playerDirection) {
        if (playerDirection == directions.None)
            return;

        var move = mapDirectionToMove(playerDirection);
        var player = playerInfo.player;
        var playerMoveUnit = Math.round(player.speed / FPS);

        var newPlayerLocation = {
            x: playerInfo.location.x + move.moveX * playerMoveUnit,
            y: playerInfo.location.y + move.moveY * playerMoveUnit
        }
        newPlayerLocation.z = playerInfo.location.z + move.moveY * playerMoveUnit;

        var oldPlayerLocation = playerInfo.location;
        playerInfo.location = newPlayerLocation;

        if (detectObjectCollision(playerInfo, barrierInfos.concat(playerInfos.filter(pi => pi !== playerInfo)))) {
            playerInfo.location = oldPlayerLocation;
        }
    }
    function getCollisionRestriction(objectInfo) {
        return { offsetY: objectInfo.dimensions.height - objectInfo.dimensions.thickness };
    };

    function detectObjectCollision(objectInfo, objectInfosToCheck) {
        return objectInfosToCheck.some(o => collisionDetector
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