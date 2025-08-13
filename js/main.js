import {getPictures} from './api.js';
import {
	renderSkeletons, clearList, appendPictures, showState, hideState
} from './galleryView.js';

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
	const list = document.getElementById('gallery-list');
	const loadMoreBtn = document.getElementById('load-more');
	const stateBox = document.getElementById('gallery-state');
	const reloadBtn = document.getElementById('reload-gallery');
	const sentinel = document.getElementById('gallery-sentinel');

	function setBusy(el, isBusy) {
		if (!el) return;
		if (isBusy) {
			el.setAttribute('aria-busy', 'true');
			el.disabled = true;              // чтобы нельзя было кликнуть
		} else {
			el.removeAttribute('aria-busy');
			el.disabled = false;
		}
	}

	function setAriaDisabled(el, disabled) {
		if (!el) return;
		if (disabled) {
			el.setAttribute('aria-disabled', 'true');
			el.disabled = true;              // синхронизируем с нативным disabled
		} else {
			el.removeAttribute('aria-disabled');
			el.disabled = false;
		}
	}

	if (sentinel) {
		const io = new IntersectionObserver((entries) => {
			const entry = entries[0];
			if (entry.isIntersecting && !loading && !reachedEnd) {
				loadPage(page + 1);
			}
		}, {rootMargin: '200px 0px 400px 0px'});
		io.observe(sentinel);
	}

	if (!list || !loadMoreBtn || !stateBox) return;

	let page = 1;
	const limit = 9;
	let loading = false;
	let reachedEnd = false;

	async function loadPage(p = 1, {replace = false} = {}) {
		if (loading || reachedEnd) return;
		loading = true;
		setBusy(loadMoreBtn, true);          // 🔹 показываем, что «Загрузить ещё» занята
		setBusy(reloadBtn, true);            // 🔹 и «Перезагрузить» тоже занята
		showState(stateBox, 'Загрузка...', 'info');

		if (replace) clearList(list);
		renderSkeletons(list, limit);

		try {
			const data = await getPictures({page: p, limit});

			// Удаляем скелетоны (последние limit элементов)
			for (let i = 0; i < limit; i++) {
				const last = list.lastElementChild;
				if (!last) break;
				last.remove();
			}

			if (!Array.isArray(data) || data.length === 0) {
				if (p === 1) {
					showState(stateBox, 'Пока нет элементов. Попробуйте перезагрузить позже.', 'info');
				} else {
					showState(stateBox, 'Больше элементов нет.', 'info');
					reachedEnd = true;                      // 🔹 ставим флаг конца
				}
			} else {
				hideState(stateBox);
				appendPictures(list, data);
				page = p;
			}
		} catch (err) {
			showState(stateBox, `Ошибка: ${err.message}. Проверьте соединение и попробуйте ещё раз.`, 'error');
		} finally {
			loadMoreBtn.disabled = reachedEnd;
			loading = false;
		}
		setBusy(loadMoreBtn, false);         // 🔹 убираем «занято»
		setBusy(reloadBtn, false);
		loading = false;

		// если дошли до конца — блокируем кнопку «Загрузить ещё»
		if (reachedEnd) {
			setAriaDisabled(loadMoreBtn, true);  // 🔹 теперь кнопка "официально" недоступна
		} else {
			setAriaDisabled(loadMoreBtn, false);
		}
	}

	// Инициализация
	loadPage(1, {replace: true});

	// Кнопки
	loadMoreBtn.addEventListener('click', () => loadPage(page + 1));
	reloadBtn?.addEventListener('click', () => {
		reachedEnd = false;
		setAriaDisabled(loadMoreBtn, false);  // снова доступна
		clearList(list);                      // очищаем галерею
		hideState(stateBox);                   // убираем сообщение
		loadPage(1, {replace: true});        // загружаем первую страницу заново
	});
});
