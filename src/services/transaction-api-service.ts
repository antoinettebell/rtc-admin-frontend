// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { OrderItem } from "@/interfaces/user-interface";
import { IResponse } from "@/interfaces/response-interface";

class TransactionApiService extends BaseAPI {
  getById(id: string) {
    return this.get<IResponse<{ order: OrderItem }>>(
      `${APIEndpoint.TRANSACTION}/${id}`,
    );
  }

  list(
    search: string,
    page: number,
    limit = 10,
    status?: any,
    transactionsType?: any,
    startDate?: any,
    endDate?: any,
  ) {
    return this.getPaginated<OrderItem>(
      `${APIEndpoint.TRANSACTION}/transaction-list`,
      "TransactionsList",
      {
        params: {
          page,
          limit,

          ...(search?.trim()?.length ? { search: search.trim() } : {}),

          // Status allow true/false/null
          ...(status !== null ? { status } : {}),
          ...(transactionsType !== null ? { transactionsType } : {}),

          // Start date
          ...(startDate ? { startDate } : {}),

          // End date
          ...(endDate ? { endDate } : {}),
        },
      },
    );
  }
}

export const transactionApiService = new TransactionApiService();
