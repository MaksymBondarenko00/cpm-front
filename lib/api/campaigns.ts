import { campaignApi } from "./client";

export enum CampaignStatus {
  ON = "ON",
  OFF = "OFF",
}

export interface Campaign {
  id: number
  accountId: number
  productId: number
  name: string
  keywords: string[]
  bidAmount: number
  campaignFund: number
  status: CampaignStatus
  town?: string
  radiusInKm: number
}

export interface CreateCampaignRequest {
  accountId: number
  productId: number
  name: string
  keywords: string[]
  bidAmount: number
  campaignFund: number
  town?: string
  radiusInKm: number
}

export interface UpdateCampaignRequest {
  name?: string;
  keywords?: string[];
  bidAmount?: number;
  campaignFund?: number;
  status?: CampaignStatus;
  town?: string;
  radiusInKm?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  empty?: boolean;
}

export interface SearchParams {
  query: string;
  town?: string;
  radius?: number;
  page?: number;
  size?: number;
}

export interface CampaignListParams {
  page?: number;
  size?: number;
}

export const campaignService = {

  async getAll(): Promise<Campaign[]> {
    const response = await campaignApi.get<Campaign[]>('/campaigns');
    return response.data;
  },

  async getAllPublic(params: CampaignListParams = {}): Promise<PageResponse<Campaign>> {
    const response = await campaignApi.get<PageResponse<Campaign>>('/campaigns/view', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 12,
      },
    });
    return response.data;
  },

  async getAllForUser(params: CampaignListParams = {}): Promise<PageResponse<Campaign>> {
    const response = await campaignApi.get<PageResponse<Campaign>>('/campaigns/all', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 12,
      },
    });
    return response.data;
  },

  async search(params: SearchParams): Promise<PageResponse<Campaign>> {
    const response = await campaignApi.get<PageResponse<Campaign>>('/campaigns/search', {
      params: {
        query: params.query,
        town: params.town || undefined,
        radius: params.radius || undefined,
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    });
    return response.data;
  },

  async getByAccount(accountId: number): Promise<Campaign[]> {
    const response = await campaignApi.get<Campaign[]>(`/campaigns/${accountId}`);
    return response.data;
  },

  async create(data: CreateCampaignRequest): Promise<Campaign> {
    const response = await campaignApi.post<Campaign>('/campaigns', data);
    return response.data;
  },

  async update(id: number, data: UpdateCampaignRequest): Promise<Campaign> {
    const response = await campaignApi.patch<Campaign>(`/campaigns/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await campaignApi.delete(`/campaigns/${id}`);
  },

  async registerClick(campaignId: number): Promise<void> {
    await campaignApi.post(`/clicks/${campaignId}`);
  },

};