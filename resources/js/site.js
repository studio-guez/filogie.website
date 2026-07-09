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

Alpine.data('parallaxStack', () => ({
	progress: 0,
	top: 0,
	height: 0,

	init() {
		this.measure();
		window.addEventListener('resize', () => this.measure());
		lenis.on('scroll', () => this.updateProgress());
		this.updateProgress();
	},

	measure() {
		const rect = this.$el.getBoundingClientRect();
		this.top = rect.top + window.scrollY;
		this.height = rect.height;
		this.updateProgress();
	},

	updateProgress() {
		// Distance left before the section's bottom edge reaches the bottom of the
		// viewport, plus an extra buffer so the anim keeps settling for a bit
		// longer after the section's bottom is fully on screen.
		const endBuffer = 200;
		const bottom = this.top + this.height + endBuffer;
		const viewportBottom = window.scrollY + window.innerHeight;
		this.progress = Math.min(this.height + endBuffer, Math.max(0, bottom - viewportBottom));
	},

	offset(speed) {
		// Always <= 0: layers start higher and ease down, all converging on their
		// bottom-0 rest position (fully stacked) at the same scroll point.
		return -this.progress * parseFloat(speed);
	},
}));

Alpine.start();
