// MongoDB client using Express API server
const MONGODB_API_URL = import.meta.env.VITE_MONGODB_API_URL || 'http://localhost:3001/api/mongodb';

export interface MongoResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class MongoDBClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || MONGODB_API_URL;
  }

  private async request<T>(
    action: string,
    collection: string,
    options: {
      filter?: any;
      data?: any;
      update?: any;
    } = {}
  ): Promise<MongoResponse<T>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          collection,
          ...options,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Find operations
  async find<T = any>(collection: string, filter: any = {}): Promise<T[]> {
    const response = await this.request<T[]>('find', collection, { filter });
    return response.success && response.data ? response.data : [];
  }

  async findOne<T = any>(collection: string, filter: any = {}): Promise<T | null> {
    const response = await this.request<T>('findOne', collection, { filter });
    return response.success && response.data ? response.data : null;
  }

  // Insert operations
  async insertOne<T = any>(collection: string, data: any): Promise<T | null> {
    const response = await this.request<T>('insertOne', collection, { data });
    return response.success && response.data ? response.data : null;
  }

  async insertMany<T = any>(collection: string, data: any[]): Promise<T[] | null> {
    const response = await this.request<T[]>('insertMany', collection, { data });
    return response.success && response.data ? response.data : null;
  }

  // Update operations
  async updateOne(collection: string, filter: any, update: any): Promise<boolean> {
    const response = await this.request('updateOne', collection, { filter, update });
    return response.success || false;
  }

  async updateMany(collection: string, filter: any, update: any): Promise<boolean> {
    const response = await this.request('updateMany', collection, { filter, update });
    return response.success || false;
  }

  // Delete operations
  async deleteOne(collection: string, filter: any): Promise<boolean> {
    const response = await this.request('deleteOne', collection, { filter });
    return response.success || false;
  }

  async deleteMany(collection: string, filter: any): Promise<boolean> {
    const response = await this.request('deleteMany', collection, { filter });
    return response.success || false;
  }

  // Count operation
  async count(collection: string, filter: any = {}): Promise<number> {
    const response = await this.request<number>('count', collection, { filter });
    return response.success && response.data ? response.data : 0;
  }
}

export const mongodb = new MongoDBClient();

