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

Alpine.data('parallaxStack', (reverse = false) => ({
	reverse,
	progress: 0,
	target: 0,
	top: 0,
	height: 0,
	viewportWidth: 0,
	viewportHeight: 0,
	rafId: null,
	lastTime: 0,
	layers: [],

	init() {
		this.viewportWidth = window.innerWidth;
		this.viewportHeight = window.innerHeight;
		// Cache each parallax layer with its speed so the render loop never has to
		// touch Alpine reactivity or the DOM to discover what to move.
		this.layers = Array.from(this.$el.querySelectorAll('[data-speed]')).map((el) => ({
			el,
			speed: parseFloat(el.dataset.speed) || 0,
			rendered: null,
		}));
		this.measure();
		this.progress = this.target;
		this.render();
		window.addEventListener('resize', () => this.handleResize());
		lenis.on('scroll', () => this.updateTarget());
		this.rafId = requestAnimationFrame((time) => this.tick(time));
	},

	destroy() {
		cancelAnimationFrame(this.rafId);
	},

	tick(time) {
		// Ease the rendered progress toward the scroll-driven target every frame
		// instead of snapping straight to the scroll position, for a smoother,
		// slightly lagging parallax feel.
		//
		// The smoothing is frame-rate independent: on mobile, frames are dropped
		// far more often than on desktop, and a fixed per-frame ease would make
		// each surviving frame jump further, which is what caused the juddering.
		// Scaling by the elapsed time keeps the motion identical regardless of
		// how many frames actually render.
		const last = this.lastTime || time;
		const dt = Math.min(time - last, 100); // clamp big gaps (tab blur, etc.)
		this.lastTime = time;

		const ease = 1 - Math.pow(1 - 0.5, dt / 16.6667);
		const delta = this.target - this.progress;
		this.progress += Math.abs(delta) < 0.01 ? delta : delta * ease;

		this.render();
		this.rafId = requestAnimationFrame((t) => this.tick(t));
	},

	render() {
		// Write transforms straight to the DOM from inside the rAF loop rather
		// than going through Alpine's `x-effect` reactivity, which flushes on a
		// microtask queue that isn't synced to the frame and stutters on mobile.
		// translate3d keeps every layer on its own compositor layer.
		for (const layer of this.layers) {
			const sign = this.reverse ? 1 : -1;
			const y = Math.round(sign * this.progress * layer.speed * 100) / 100;
			if (y === layer.rendered) {
				continue;
			}
			layer.rendered = y;
			layer.el.style.transform = `translate3d(0, ${y}px, 0)`;
		}
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
}));

Alpine.start();
