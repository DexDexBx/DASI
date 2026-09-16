export interface HealthResponse {
  status: string;
  service: string;
}

export interface HealthDbResponse {
  status: string;
  database: string;
  message: string;
}