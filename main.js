const marquee = document.querySelector('.marquee');
const block = marquee.querySelector('.marquee__container');

marquee.addEventListener('mouseenter', () => {
	block.style.animationPlayState = 'paused';
});
marquee.addEventListener('mouseleave', () => {
	block.style.animationPlayState = 'running';
});