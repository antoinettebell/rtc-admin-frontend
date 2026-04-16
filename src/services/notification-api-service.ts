import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { Notification } from "@/interfaces/user-interface";

class NotificationAPIService extends BaseAPI {
  list(search: string, page: number, limit: number) {
    return this.getPaginated<Notification>(
      `${APIEndpoint.NOTIFICATION}/notificationslist`,
      "notificationList",
      {
        params: {
          page,
          limit,
          ...(search.trim().length ? { search: search.trim() } : {}),
        },
      }
    );
  }

  send(data: { recipientType: string; title: string; description: string }) {
    return this.post(`${APIEndpoint.NOTIFICATION}/send-notification`, data);
  }
}

export const notificationApiService = new NotificationAPIService();
