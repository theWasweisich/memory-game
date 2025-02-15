function scale(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
	return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function randomBetween(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function shuffleArray(array: Array<any>) {
	let currentIndex = array.length;

	while (currentIndex !== 0) {
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		let temp = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temp;
	}
}

abstract class Image_ {
	url: string;
	alt: string;
}