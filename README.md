## Q&A Week 1

**1. Flex vs Grid — когда что выбираем?**

Flexbox лучше использовать для одномерного расположения элементов (строка или столбец),
а CSS Grid - для двумерного, когда нужно управлять расположением как по горизонтали, так и по вертикали.

**2. auto-fill vs auto-fit в Grid**

Основное различие между ними проявляется, когда колонок может быть больше, чем нужно для заполнения доступного пространства.
auto-fill создаст "пустые" колонки, даже если они не содержат элементов,
в то время как auto-fit сожмет пустые колонки, расширяя существующие элементы, чтобы заполнить доступное пространство.

**3. Что делает AbortController и чем полезен таймаут?**

AbortController предоставляет механизм для прерывания асинхронных операций, таких как сетевые запросы, таймеры или другие операции, которые могут быть отменены.
Таймаут, в свою очередь, является частным случаем использования AbortController для автоматического прерывания операции по истечении заданного времени.

**4. Где и как обрабатываем ошибки при fetch? Почему проверяем response.ok?**

При использовании fetch() ошибки обрабатываются через .then() для успешного ответа и .catch() для обработки ошибок,
связанных с сетевыми проблемами или проблемами при выполнении запроса. Важно проверять статус ответа (например, response.ok) и обрабатывать ошибки сервера отдельно.
Проверка response.ok в JavaScript, особенно при использовании Fetch API, необходима для определения успешности HTTP-ответа.

**5. Что дают aria-busy и aria-disabled?**

Атрибуты aria-busy и aria-disabled в ARIA (Accessible Rich Internet Applications) используются для предоставления информации о состоянии элементов веб-страницы вспомогательным технологиям,
таким как скринридеры. Они помогают улучшить доступность веб-контента для людей с ограниченными возможностями.

**6. Почему стоит показывать скелетоны вместо пустого места?**

Показывать скелетоны вместо пустого места во время загрузки контента на сайте или в приложении имеет несколько преимуществ.
Это улучшает пользовательский опыт, создавая иллюзию быстрой загрузки и направляя внимание пользователя на структуру и расположение элементов на странице.

---

## План React+TS

#### Архитектура будущего SPA (React + TS + MUI + React Router)

/src
  /app
    App.tsx                 # корневой компонент с маршрутизацией
    routes.tsx              # декларативное описание роутов
    theme.ts                # тема MUI (цвета, типографика)
  /pages
    Home/
      Home.tsx              # главная страница
  /components
    Header/
      Header.tsx
      Header.types.ts
    Gallery/
      Gallery.tsx
      Gallery.types.ts
      useGallery.ts         # хук для пагинации/загрузки
      GalleryItem.tsx
    Modal/
      ContactModal.tsx
      ContactModal.types.ts
      contactSchema.ts      # yup/zod схема валидации
  /lib
    api/
      fetchJSON.ts          # обёртка над fetch с таймаутом и ошибками
      pictures.ts           # функции работы с Picsum API
    types/
      pictures.ts           # общие типы доменной модели
  /shared
    hooks/                  # общие кастом-хуки (например useAbortableFetch)
    ui/                     # мелкие переиспользуемые UI-компоненты
  main.tsx                  # входная точка Vite
  vite-env.d.ts

#### Типы и пропсы (TS-наброски)

**Доменные типы**

// /src/lib/types/pictures.ts
export type Picture = {
  id: string;
  author: string;
  width: number;
  height: number;
  download_url: string;
};

**API-слой**

// /src/lib/api/fetchJSON.ts
export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export async function fetchJSON<T>(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<T> {
  const { timeout = 12000, ...rest } = options;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, ...rest });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new HttpError(text || res.statusText, res.status);
    }
    return (await res.json()) as T;
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw e instanceof Error ? e : new Error('Unknown network error');
  } finally {
    clearTimeout(id);
  }
}

// /src/lib/api/pictures.ts
import { fetchJSON } from './fetchJSON';
import type { Picture } from '../types/pictures';

const BASE = 'https://picsum.photos/v2/list';

export async function getPictures(params: { page: number; limit: number }): Promise<Picture[]> {
  const { page, limit } = params;
  const url = `${BASE}?page=${page}&limit=${limit}`;
  return fetchJSON<Picture[]>(url);
}

**Header**

// /src/components/Header/Header.types.ts
export type HeaderProps = {
  onOpenContact?: () => void;   // открыть модалку
  activePath?: string;          // чтобы подсветить текущий роут
};

**Gallery**

// /src/components/Gallery/Gallery.types.ts
import type { Picture } from '../../lib/types/pictures';

export type GalleryProps = {
  initialPage?: number;         // стартовая страница (по умолчанию 1)
  pageSize?: number;            // размер страницы (по умолчанию 9)
  autoLoad?: boolean;           // автоподгрузка через IntersectionObserver
  onLoadMore?: (nextPage: number) => void; // сообщаем наружу о запросе следующей страницы
  onError?: (error: Error) => void;        // репортим ошибку наверх (например, в toast)
  className?: string;
};

export type GalleryState = {
  page: number;
  items: Picture[];
  loading: boolean;
  reachedEnd: boolean;
  error: string | null;
};

// /src/components/Gallery/useGallery.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPictures } from '../../lib/api/pictures';
import type { Picture } from '../../lib/types/pictures';

export function useGallery(initialPage = 1, pageSize = 9) {
  const [page, setPage] = useState(initialPage);
  const [items, setItems] = useState<Picture[]>([]);
  const [loading, setLoading] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async (p: number, replace = false) => {
    if (loading || reachedEnd) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPictures({ page: p, limit: pageSize });
      if (!data.length) {
        if (p === 1) setItems([]); // пустое состояние
        setReachedEnd(true);
      } else {
        setItems(prev => (replace ? data : [...prev, ...data]));
        setPage(p);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [loading, reachedEnd, pageSize]);

  const reload = useCallback(() => {
    setReachedEnd(false);
    setItems([]);
    setPage(1);
    return loadPage(1, true);
  }, [loadPage]);

  return useMemo(() => ({
    page, items, loading, reachedEnd, error,
    loadNext: () => loadPage(page + 1),
    reload,
  }), [page, items, loading, reachedEnd, error, loadPage, reload]);
}

**ContactModal (react-hook-form)**

// /src/components/Modal/ContactModal.types.ts
export type ContactModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { name: string; phone: string }) => Promise<void> | void;
};

#### Где хранится состояние пагинации и как идут события

	•	Состояние пагинации хранится внутри <Gallery /> (локальный стейт через useGallery):
	•	page, items, loading, reachedEnd, error.
	•	Это упрощает изоляцию логики и повторное использование компонента на разных страницах.
	•	События наружу:
	•	onLoadMore(nextPage) — если родителю нужно логировать/метрить подгрузки (опционально).
	•	onError(error) — если родитель показывает глобальные уведомления (toast/snackbar).
	•	Родитель (страница Home) просто рендерит <Gallery /> и может подмешать UI (кнопки «ещё», статус, футер и т.п.).

#### Роутинг (набросок)

// /src/app/routes.tsx
import { createBrowserRouter } from 'react-router-dom';
import { Home } from '../pages/Home/Home';

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  // { path: '/about', element: <About /> },
]);

// /src/app/App.tsx
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { router } from './routes';
import { theme } from './theme';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

// /src/pages/Home/Home.tsx
import Header from '../../components/Header/Header';
import Gallery from '../../components/Gallery/Gallery';
import ContactModal from '../../components/Modal/ContactModal';
import { useState } from 'react';

export function Home() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Header onOpenContact={() => setOpen(true)} />
      <main>
        <Gallery pageSize={9} autoLoad />
      </main>
      <ContactModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={async (data) => {
          // отправка формы (пока mock)
          console.log('submit', data);
          setOpen(false);
        }}
      />
    </>
  );
}
