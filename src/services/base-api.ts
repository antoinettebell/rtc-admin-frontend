// lib/BaseAPI.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { IPaginateResponse } from "@/interfaces/response-interface";
import { User } from "@/interfaces/user-interface";

export class BaseAPI {
  protected api: AxiosInstance;

  constructor(baseURL?: string) {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // fallback to env variable
      headers: {
        "Content-Type": "application/json",
      },
    } as any);

    // Optionally add interceptors here (for auth tokens, logging, etc.)
    this.api.interceptors.request.use(
      (config) => {
        // Example: Attach token
        const token = localStorage.getItem("token");
        if (token) {
          config.headers["Authorization"] = `${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );
  }

  protected get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  protected post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  protected put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  protected delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }

  protected getPaginated<T>(
    url: string,
    resultKey: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.api.get<IPaginateResponse<T>>(url, config).then((res) => {
      const data = res.data.data;
      const records = data[resultKey];
      delete data[resultKey];
      res.data.data = {
        ...data,
        records,
      };
      return res;
    });
  }
}
