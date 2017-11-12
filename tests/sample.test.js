import test from 'ava';

test('foo', t => {
	t.pass();
});

test('bar', async t => {
	const bar = Promise.resolve('bar');

	t.is(await bar, 'bar');
});

test('equality test', t => {
	t.deepEqual([1, 2], [1, 2]);
});
test('sum test', t => {
	t.true(2+ 2 === 4);
});
test('detect correctly when collision not occures', t => {
	t.is(checkCollision(), false, 'collision was detected! but it shouldn\'t.');
})

function checkCollision(){
	return false;
}