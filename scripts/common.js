(function (window) {
    "use strict";
    const allowedMoves = {
        Move: 'Move', Shoot: 'Shoot'
    }

    const directions = {
        None: 'None', N: 'N', S: 'S', W: 'W', E: 'E', SE: 'SE', SW: 'SW', NE: 'NE', NW: 'NW'
    };

    const imageTypes = {
        Background: {src: 'images/grass_background.png', width: 1916, height:1916, thickness:0},
        Player: { src: 'images/player.png', width: 30, height: 30, thickness: 10 },
        Enemy: { src: 'images/enemy.png', width: 30, height: 30, thickness: 10 },
        FireBullet: { src: 'images/fireBullet.png', width: 20, height: 20, thickness: 10 },
        Rock: { src: 'images/rock.png', width: 120, height: 83, thickness: 30 },
        Tree: { src: 'images/tree.png', width: 50, height: 50, thickness: 16 }
    };

    function getImageTypeDimensions(imageType) {
        return { width: imageType.width, height: imageType.height, thickness: imageType.thickness };
    }

    window.GAME = window.GAME || {};
    window.GAME.allowedMoves = allowedMoves;
    window.GAME.directions = directions;
    window.GAME.imageTypes = imageTypes;
    window.GAME.getImageTypeDimensions = getImageTypeDimensions;
})(this);