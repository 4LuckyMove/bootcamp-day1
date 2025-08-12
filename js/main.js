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

document.addEventListener('DOMContentLoaded', () => {
	const openBtn = document.getElementById('open-modal');
	const dialog = document.getElementById('contact-modal');
	const closeBtn = dialog?.querySelector('.modal__close');

	if (openBtn && dialog) {
		openBtn.addEventListener('click', (e) => {
			e.preventDefault();
			dialog.showModal();
		});
	}
	if (closeBtn && dialog) {
		closeBtn.addEventListener('click', () => dialog.close());
	}
	// Закрытие по клику на backdrop
	if (dialog) {
		dialog.addEventListener('click', (e) => {
			const rect = dialog.getBoundingClientRect();
			const inDialog = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
			if (!inDialog) dialog.close();
		});
		dialog.addEventListener('cancel', (e) => {
			e.preventDefault();
			dialog.close();
		});
	}
});