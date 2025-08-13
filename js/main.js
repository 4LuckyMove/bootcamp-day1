import {getPictures} from './api.js';

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

document.addEventListener('DOMContentLoaded', () => {
	// --- Галерея из API ---
	const list = document.getElementById('gallery-list');
	const loadMoreBtn = document.getElementById('load-more');
	const stateBox = document.getElementById('gallery-state');
	const reloadBtn = document.getElementById('reload-gallery');

	if (!list || !loadMoreBtn || !stateBox) return;

	let page = 1;
	const limit = 9;
	let loading = false;

	function showState(msg, {type = 'info'} = {}) {
		stateBox.textContent = msg;
		stateBox.hidden = !msg;
		stateBox.style.background = type === 'error' ? '#fee2e2' : '#fff7ed';
		stateBox.style.borderColor = type === 'error' ? '#fecaca' : '#fed7aa';
	}

	function renderSkeletons(count = 9) {
		const frag = document.createDocumentFragment();
		for (let i = 0; i < count; i++) {
			const li = document.createElement('li');
			li.className = 'gallery__item';
			const ph = document.createElement('div');
			ph.className = 'skeleton';
			li.appendChild(ph);
			frag.appendChild(li);
		}
		list.appendChild(frag);
	}

	function replaceSkeleton(li, imgEl) {
		li.innerHTML = '';
		li.appendChild(imgEl);
	}

	function createImageItem(photo) {
		const li = document.createElement('li');
		li.className = 'gallery__item';
		const img = document.createElement('img');
		// Picsum отдаёт width/height/author/id
		img.alt = `Фото от ${photo.author || 'неизвестного автора'}`;
		img.loading = 'lazy';
		img.width = 600;
		img.height = 400;
		// Можно запросить конкретный размер:
		img.src = `https://picsum.photos/id/${photo.id}/600/400`;
		li.appendChild(img);
		return li;
	}

	async function loadPage(p = 1) {
		if (loading) return;
		loading = true;
		loadMoreBtn.disabled = true;
		showState('Загрузка...', {type: 'info'});

		// Скелетоны вместо пустоты
		renderSkeletons(limit);

		try {
			const data = await getPictures({page: p, limit});
			// Удаляем скелетоны только что добавленные (последние N элементов)
			for (let i = 0; i < limit; i++) {
				const last = list.lastElementChild;
				if (!last) break;
				last.remove();
			}
			// Рендерим реальные картинки
			const frag = document.createDocumentFragment();
			data.forEach(item => frag.appendChild(createImageItem(item)));
			list.appendChild(frag);

			showState(`Загружена страница ${p}`, {type: 'info'});
			page = p;
		} catch (err) {
			showState(`Ошибка: ${err.message}. Попробуйте ещё раз.`, {type: 'error'});
		} finally {
			loadMoreBtn.disabled = false;
			loading = false;
		}
	}

	// Первичная загрузка
	loadPage(1);

	// «Загрузить ещё»
	loadMoreBtn.addEventListener('click', () => loadPage(page + 1));

	// Перезагрузка первой страницы (очистка и заново)
	reloadBtn?.addEventListener('click', () => {
		list.innerHTML = '';
		showState('');
		loadPage(1);
	});
});
