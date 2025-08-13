// galleryView.js
export function renderSkeletons(listEl, count = 9) {
	const frag = document.createDocumentFragment();
	for (let i = 0; i < count; i++) {
		const li = document.createElement('li');
		li.className = 'gallery__item';
		const ph = document.createElement('div');
		ph.className = 'skeleton';
		li.appendChild(ph);
		frag.appendChild(li);
	}
	listEl.appendChild(frag);
}

export function clearList(listEl) {
	listEl.innerHTML = '';
}

export function appendPictures(listEl, photos) {
	const frag = document.createDocumentFragment();
	photos.forEach((p) => {
		const li = document.createElement('li');
		li.className = 'gallery__item';
		const img = document.createElement('img');
		img.alt = `Фото от ${p.author || 'неизвестного автора'}`;
		img.loading = 'lazy';
		img.width = 600;
		img.height = 400;
		img.src = `https://picsum.photos/id/${p.id}/600/400`;
		li.appendChild(img);
		frag.appendChild(li);
	});
	listEl.appendChild(frag);
}

export function showState(boxEl, msg, type = 'info') {
	boxEl.textContent = msg;
	boxEl.hidden = !msg;
	boxEl.setAttribute('role', 'status');
	boxEl.setAttribute('aria-live', 'polite');
	boxEl.style.background = type === 'error' ? '#fee2e2' : '#fff7ed';
	boxEl.style.borderColor = type === 'error' ? '#fecaca' : '#fed7aa';
}

export function hideState(boxEl) {
	boxEl.hidden = true;
	boxEl.textContent = '';
}
