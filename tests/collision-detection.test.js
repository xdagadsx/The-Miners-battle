import test from 'ava';

test('collision detected when one object is in another', t => {
    var firstObjectLocation = { x: 0, y: 0 };
    var firstObjectSize = { height: 200, width: 200 };
    var secondObjectLocation = { x: 50, y: 50 };
    var secondObjectSize = { height: 50, width: 50 };

    var collisionDetected = detectCollision(firstObjectLocation, firstObjectSize, secondObjectLocation, secondObjectSize);

    t.is(collisionDetected, true);
})

test('collision detected when one object is in another different order', t => {
    var firstObjectLocation = { x: 0, y: 0 };
    var firstObjectSize = { height: 200, width: 200 };
    var secondObjectLocation = { x: 50, y: 50 };
    var secondObjectSize = { height: 50, width: 50 };

    var collisionDetected = detectCollision(secondObjectLocation, secondObjectSize, firstObjectLocation, firstObjectSize);

    t.is(collisionDetected, true);
})
test('collision not detected ', t => {
    var firstObjectLocation = { x: 0, y: 0 };
    var firstObjectSize = { height: 200, width: 200 };
    var secondObjectLocation = { x: 260, y: 260 };
    var secondObjectSize = { height: 50, width: 50 };

    var collisionDetected = detectCollision(firstObjectLocation, firstObjectSize, secondObjectLocation, secondObjectSize);

    t.is(collisionDetected, false);
})
test('collision detected with right wall ', t => {
    var firstObjectLocation = { x: 0, y: 0 };
    var firstObjectSize = { height: 200, width: 200 };
    var secondObjectLocation = { x: 180, y: 10 };
    var secondObjectSize = { height: 50, width: 50 };

    var collisionDetected = detectCollision(firstObjectLocation, firstObjectSize, secondObjectLocation, secondObjectSize);

    t.is(collisionDetected, true);
})

test('collision detected with right wall different order', t => {
    var firstObjectLocation = { x: 0, y: 0 };
    var firstObjectSize = { height: 200, width: 200 };
    var secondObjectLocation = { x: 180, y: 10 };
    var secondObjectSize = { height: 50, width: 50 };

    var collisionDetected = detectCollision(secondObjectLocation, secondObjectSize, firstObjectLocation, firstObjectSize);

    t.is(collisionDetected, true);
})

test('collision detected when objects with same size has same location', t => {
    var firstObjectLocation = { x: 0, y: 0 };
    var firstObjectSize = { height: 200, width: 200 };
    var secondObjectLocation = { x: 0, y: 0 };
    var secondObjectSize = { height: 200, width: 200 };

    var collisionDetected = detectCollision(secondObjectLocation, secondObjectSize, firstObjectLocation, firstObjectSize);

    t.is(collisionDetected, true);
})

test('collision detected when objects touching each other', t => {
    var firstObjectLocation = { x: 0, y: 0 };
    var firstObjectSize = { height: 100, width: 100 };
    var secondObjectLocation = { x: 100, y: 100 };
    var secondObjectSize = { height: 200, width: 200 };

    var collisionDetected = detectCollision(secondObjectLocation, secondObjectSize, firstObjectLocation, firstObjectSize);

    t.is(collisionDetected, true);
})


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

