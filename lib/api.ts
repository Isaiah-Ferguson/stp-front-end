/**
 * api.ts — Central API utility for calling the ASP.NET Core backend.
 *
 * Usage:
 *   import { apiGet, apiPost } from "@/lib/api";
 *
 *   const health = await apiGet("/api/health");
 *   const result = await apiPost("/api/contacts", { name: "Jane" });
 *
 * The base URL is read from the NEXT_PUBLIC_API_URL environment variable.
 * Set this in .env.local: NEXT_PUBLIC_API_URL=http://localhost:5000
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

/**
 * Generic GET request to the backend API.
 * @param path - The API path (e.g. "/api/health")
 */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`GET ${path} failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Generic POST request to the backend API.
 * @param path - The API path (e.g. "/api/contacts")
 * @param body - The request body (will be serialized to JSON)
 */
export async function apiPost<TBody, TResponse>(
  path: string,
  body: TBody
): Promise<TResponse> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`POST ${path} failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<TResponse>;
}

/**
 * Generic PUT request to the backend API.
 * @param path - The API path (e.g. "/api/contacts/1")
 * @param body - The request body (will be serialized to JSON)
 */
export async function apiPut<TBody, TResponse>(
  path: string,
  body: TBody
): Promise<TResponse> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`PUT ${path} failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<TResponse>;
}

/**
 * Generic DELETE request to the backend API.
 * @param path - The API path (e.g. "/api/contacts/1")
 */
export async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`DELETE ${path} failed: ${response.status} ${response.statusText}`);
  }
}
