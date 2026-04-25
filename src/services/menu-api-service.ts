// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { MenuCsvImportSummary, MenuItem } from "@/interfaces/user-interface";
import { IResponse } from "@/interfaces/response-interface";

class MenuApiService extends BaseAPI {
  list(search: string, page: number, limit = 10, extraParam = {}) {
    return this.getPaginated<MenuItem>(`${APIEndpoint.MENU}`, "menuList", {
      params: {
        page,
        limit,
        ...(search.trim().length ? { search: search.trim() } : {}),
        ...extraParam,
      },
    });
  }

  importCsv(file: File, vendorUserId: string, imageFiles: File[] = []) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendorUserId", vendorUserId);
    imageFiles.forEach((imageFile) => {
      formData.append("images", imageFile);
    });

    return this.post<IResponse<{ importSummary: MenuCsvImportSummary }>>(
      `${APIEndpoint.MENU}/import-csv`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  }
}

export const menuApiService = new MenuApiService();
