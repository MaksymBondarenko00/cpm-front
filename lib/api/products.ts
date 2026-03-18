import { campaignApi } from './client';

export interface Product {
  id: number;
  accountId: number;
  name: string;
  description: string;
  price: number;
}

export interface CreateProductRequest {
  accountId: number;
  name: string;
  description: string;
  price: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
}

export const productService = {
  async getAll(): Promise<Product[]> {
    const response = await campaignApi.get<Product[]>('/products');
    return response.data;
  },

  async getById(id: number): Promise<Product> {
    const response = await campaignApi.get<Product>(`/products/${id}`);
    return response.data;
  },

  async create(data: CreateProductRequest): Promise<Product> {
    const response = await campaignApi.post<Product>('/products', data);
    return response.data;
  },

  async update(id: number, data: UpdateProductRequest): Promise<Product> {
    const response = await campaignApi.patch<Product>(`/products/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await campaignApi.delete(`/products/${id}`);
  },
};
