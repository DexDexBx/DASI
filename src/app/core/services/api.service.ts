import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiErrorPayload } from '../models/api-response.model';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, query: object = {}): Observable<T> {
    return this.http
      .get<T>(`${this.apiUrl}${path}`, { params: this.buildParams(query) })
      .pipe(catchError((err) => this.handleError(err)));
  }

  getById<T>(path: string, id: string, query: object = {}): Observable<T> {
    return this.http
      .get<T>(`${this.apiUrl}${path}/${id}`, { params: this.buildParams(query) })
      .pipe(catchError((err) => this.handleError(err)));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(`${this.apiUrl}${path}`, body)
      .pipe(catchError((err) => this.handleError(err)));
  }

  patch<T>(path: string, id: string, body: unknown): Observable<T> {
    return this.http
      .patch<T>(`${this.apiUrl}${path}/${id}`, body)
      .pipe(catchError((err) => this.handleError(err)));
  }

  delete<T>(path: string, id: string): Observable<T> {
    return this.http
      .delete<T>(`${this.apiUrl}${path}/${id}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  private buildParams(query: object): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    let message = 'Error inesperado al comunicarse con el servidor';

    if (err.status === 0) {
      message = 'No se pudo conectar con el servidor de DASI';
    } else {
      const payload = err.error as ApiErrorPayload | undefined;
      if (payload?.message) {
        message = Array.isArray(payload.message) ? payload.message.join(', ') : payload.message;
      } else if (err.message) {
        message = err.message;
      }
    }

    return throwError(() => new ApiError(message, err.status, err.statusText));
  }
}