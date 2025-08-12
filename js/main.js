document.addEventListener('DOMContentLoaded', () => {
	const toggle = document.querySelector('.menu-toggle');
	const nav = document.querySelector('#primary-nav');
	if (!toggle || !nav) return;

	const closeMenu = () => {
		nav.classList.remove('is-open');
		toggle.setAttribute('aria-expanded', 'false');
		document.body.classList.remove('menu-open');
	};
	const openMenu = () => {
		nav.classList.add('is-open');
		toggle.setAttribute('aria-expanded', 'true');
		document.body.classList.add('menu-open');
	};

	toggle.addEventListener('click', () => {
		nav.classList.contains('is-open') ? closeMenu() : openMenu();
	});

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') closeMenu();
	});

	nav.addEventListener('click', (e) => {
		if (e.target.closest('a')) closeMenu();
	});
});