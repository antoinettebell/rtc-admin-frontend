// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { IResponse } from "@/interfaces/response-interface";

class FileApiService extends BaseAPI {
  upload(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    return this.post<IResponse<{ file: string }>>(`${APIEndpoint.FILE}`, fd, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }
}

export const fileApiService = new FileApiService();
