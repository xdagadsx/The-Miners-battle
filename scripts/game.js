gameObject = new game();

function game() {
    //import all dependencies from other files
    var collisionDetector = window.GAME.collisionDetector;
    var player = window.GAME.player;
    var enemy = window.GAME.enemy;
    var barrier = window.GAME.barrier;
    var bullet = window.GAME.bullet;
    var imageTypes = window.GAME.imageTypes;
    var allowedMoves = window.GAME.allowedMoves;
    var directions = window.GAME.directions;

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
                if (collisionDetector.detectCollision(playerInfo.location, playerInfo.image, bulletInfo.location, bulletInfo.image, getCollisionRestriction(playerInfo), getCollisionRestriction(bulletInfo))) {
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