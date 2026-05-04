export interface IResponse<T> {
  code: number;
  success: boolean;
  data: T;
  error: any;
  message: string;
}

export interface IPaginateResponse<T> {
  code: number;
  success: boolean;
  data: {
    records: T[];
    total: number;
    page: number;
    totalPages: number;
    [key: string]: any;
  };
  error: any;
  message: string;
}
