import { Observable, defer, from } from 'rxjs';
import { concatMap, reduce } from 'rxjs/operators';
import { ApiListResponse } from '../models/api-response.model';

const LIMITE_PAGINA = 100;
const MAX_PAGINAS = 10;

export function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Observable<ApiListResponse<T>>,
  limit: number = LIMITE_PAGINA,
): Observable<T[]> {
  return defer(() => fetchPage(1, limit)).pipe(
    concatMap((primera) => {
      const totalPaginas = Math.min(Math.max(primera.meta.totalPages, 1), MAX_PAGINAS);
      if (totalPaginas <= 1) {
        return from([primera.data]);
      }
      const restantes = Array.from({ length: totalPaginas - 1 }, (_, i) => i + 2);
      return from(restantes).pipe(
        concatMap((page) => fetchPage(page, limit)),
        reduce((acumulado, res) => [...acumulado, ...res.data], primera.data),
      );
    }),
  );
}