import Alpine from 'alpinejs';
import Lenis from 'lenis';

window.Alpine = Alpine;

const lenis = new Lenis();
window.lenis = lenis;

function raf(time) {
	lenis.raf(time);
	requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

Alpine.start();
