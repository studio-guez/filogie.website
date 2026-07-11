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
	target: 0,
	top: 0,
	height: 0,
	viewportWidth: 0,
	viewportHeight: 0,
	rafId: null,

	init() {
		this.viewportWidth = window.innerWidth;
		this.viewportHeight = window.innerHeight;
		this.measure();
		this.progress = this.target;
		window.addEventListener('resize', () => this.handleResize());
		lenis.on('scroll', () => this.updateTarget());
		this.rafId = requestAnimationFrame(() => this.tick());
	},

	destroy() {
		cancelAnimationFrame(this.rafId);
	},

	tick() {
		// Ease the rendered progress toward the scroll-driven target every frame
		// instead of snapping straight to the scroll position, for a smoother,
		// slightly lagging parallax feel.
		const ease = 0.5;
		const delta = this.target - this.progress;
		this.progress += Math.abs(delta) < 0.01 ? delta : delta * ease;
		this.rafId = requestAnimationFrame(() => this.tick());
	},

	handleResize() {
		// Mobile browsers fire `resize` when the address bar shows/hides while
		// scrolling, which only changes window.innerHeight, not the width. Ignore
		// those so the parallax offset doesn't jump mid-scroll; only remeasure on
		// genuine width changes (real resize/orientation change).
		if (window.innerWidth === this.viewportWidth) {
			return;
		}
		this.viewportWidth = window.innerWidth;
		this.viewportHeight = window.innerHeight;
		this.measure();
	},

	measure() {
		const rect = this.$el.getBoundingClientRect();
		this.top = rect.top + window.scrollY;
		this.height = rect.height;
		this.updateTarget();
	},

	updateTarget() {
		// Distance left before the section's bottom edge reaches the bottom of the
		// viewport, plus an extra buffer so the anim keeps settling for a bit
		// longer after the section's bottom is fully on screen.
		// Uses the cached viewportHeight (not the live window.innerHeight) so the
		// mobile address bar showing/hiding mid-scroll doesn't shift the offset.
		const endBuffer = 200;
		const bottom = this.top + this.height + endBuffer;
		const viewportBottom = window.scrollY + this.viewportHeight;
		this.target = Math.min(this.height + endBuffer, Math.max(0, bottom - viewportBottom));
	},

	offset(speed) {
		// Always <= 0: layers start higher and ease down, all converging on their
		// bottom-0 rest position (fully stacked) at the same scroll point.
		return -this.progress * parseFloat(speed);
	},
}));

Alpine.start();
