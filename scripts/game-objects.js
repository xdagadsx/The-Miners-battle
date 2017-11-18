(function (window) {
    "use strict";
    window.GAME = window.GAME || {};
    var imageTypes = window.GAME.imageTypes;
    var directions = window.GAME.directions;
    var allowedMoves = window.GAME.allowedMoves;
    var getImageTypeDimensions = window.GAME.getImageTypeDimensions;

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

    function barrier(imageType, durability) {
        var that = this;
        that.description = 'barrier';
        that.dimensions = getImageTypeDimensions(imageType);
        that.hp = durability || Infinity;

        that.getImage = function () {
            var image = new Image();
            image.src = imageType.src;

            return image;
        }
    }

    window.GAME.player = player;
    window.GAME.enemy = enemy;
    window.GAME.bullet = bullet;
    window.GAME.barrier = barrier;
})(this);