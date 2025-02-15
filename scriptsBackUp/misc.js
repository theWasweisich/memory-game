function scale(value, inMin, inMax, outMin, outMax) {
	return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function randomBetween(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function shuffleArray(array) {
	let currentIndex = array.length;

	while (currentIndex !== 0) {
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		let temp = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temp;
	}
}

class Image_ {
	static url;
	static name;
}