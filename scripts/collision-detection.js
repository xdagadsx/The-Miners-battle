//@ts-check
(function (window) {
    "use strict";

    function getObjectCoordinates(objectLocation, objectImage, checkingRestrictions) {
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

    function isInRange(number, rangeStart, rangeEnd) {
        return number <= rangeEnd && number >= rangeStart;
    }

    function rectangleBaseCollisionDetector() {

        this.detectCollision = function (firstObjectLocation, firstObjectImage, secondObjectLocation, secondObjectImage, firstObjectCheckingRestrictions, secondObjectCheckingRestrictions) {
            var o1 = getObjectCoordinates(firstObjectLocation, firstObjectImage, firstObjectCheckingRestrictions);
            var o2 = getObjectCoordinates(secondObjectLocation, secondObjectImage, secondObjectCheckingRestrictions);

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
            var o1 = getObjectCoordinates(firstObjectLocation, firstObjectImage, firstObjectCheckingRestrictions);
            var o2 = getObjectCoordinates(secondObjectLocation, secondObjectImage, secondObjectCheckingRestrictions);

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

    var colorCollisionDetector = new colorBaseCollisionDetector();
    window.GAME = window.GAME || {};
    window.GAME.collisionDetector = colorCollisionDetector;
})(this);