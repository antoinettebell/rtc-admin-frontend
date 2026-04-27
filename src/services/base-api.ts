// lib/BaseAPI.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { IPaginateResponse } from "@/interfaces/response-interface";

export class BaseAPI {
  protected api: AxiosInstance;

  constructor(baseURL?: string) {
    const resolvedBaseURL = (baseURL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "")
      .trim()
      .replace(/\/+$/, "");

    this.api = axios.create({
      baseURL: resolvedBaseURL || undefined,
      headers: {
        "Content-Type": "application/json",
      },
    } as any);

    this.api.interceptors.request.use(
      (config) => {
        if (!config.headers) {
          config.headers = {};
        }

        if (typeof window === "undefined") {
          return config;
        }

        const token = localStorage.getItem("token");
        if (token) {
          // This backend expects the raw JWT, not a Bearer token.
          config.headers["Authorization"] = token;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          typeof window !== "undefined" &&
          error?.code === "ERR_NETWORK" &&
          !error?.response
        ) {
          const requestBaseURL =
            error?.config?.baseURL || resolvedBaseURL || "NEXT_PUBLIC_API_BASE_URL is not set";

          error.message = `Network Error: unable to reach API at ${requestBaseURL}. Check NEXT_PUBLIC_API_BASE_URL and confirm the backend server is running.`;
        }

        return Promise.reject(error);
      },
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
