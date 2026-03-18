import { accountApi } from './client';

export interface AccountResponse {
  id: number;
  userId: number;
  balance: number;
}

export const accountService = {
  async getByUser(): Promise<AccountResponse> {
    const response = await accountApi.get<AccountResponse>('/accounts/user');
    return response.data;
  },

  async getBalance(): Promise<number> {
    const response = await accountApi.get<number>('/accounts/balance');
    return response.data;
  },

  async deposit(amount: number): Promise<AccountResponse> {
    const response = await accountApi.post<AccountResponse>('/accounts/deposit', null, {
      params: { amount },
    });
    return response.data;
  },
};
