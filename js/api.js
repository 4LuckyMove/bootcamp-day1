// Общая функция запроса с таймаутом и проверкой ошибок
export async function fetchJSON(url, {timeout = 12000, ...options} = {}) {
	const ctrl = new AbortController();
	const id = setTimeout(() => ctrl.abort(), timeout);
	try {
		const res = await fetch(url, {signal: ctrl.signal, ...options});
		if (!res.ok) {
			const text = await res.text().catch(() => '');
			throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
		}
		return await res.json();
	} catch (err) {
		// Превращаем в «читаемую» ошибку
		if (err.name === 'AbortError') throw new Error('Превышено время ожидания запроса');
		throw new Error(err.message || 'Неизвестная ошибка сети');
	} finally {
		clearTimeout(id);
	}
}

// Конкретный источник картинок (Picsum API)
const BASE = 'https://picsum.photos/v2/list';

export async function getPictures({page = 1, limit = 9} = {}) {
	const url = `${BASE}?page=${page}&limit=${limit}`;
	return fetchJSON(url);
}
