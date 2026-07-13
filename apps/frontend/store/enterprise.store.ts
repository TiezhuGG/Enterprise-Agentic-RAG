'use client';

import { create } from 'zustand';
import { enterpriseService } from '@/services/enterprise.service';
import type { EnterpriseStructure } from '@/types/enterprise';

interface EnterpriseState {
  error: string | null;
  loading: boolean;
  structure: EnterpriseStructure | null;
  createDepartment: (input: {
    name: string;
    organizationId: string;
    parentId?: string;
  }) => Promise<boolean>;
  createOrganization: (name: string) => Promise<boolean>;
  loadStructure: () => Promise<void>;
  updateDepartment: (
    id: string,
    input: { name?: string; parentId?: string | null; status?: 'ACTIVE' | 'DISABLED' },
  ) => Promise<boolean>;
  updateOrganization: (
    id: string,
    input: { name?: string; status?: 'ACTIVE' | 'DISABLED' },
  ) => Promise<boolean>;
}

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : '加载组织结构失败，请稍后重试。';

export const useEnterpriseStore = create<EnterpriseState>((set, get) => ({
  error: null,
  loading: false,
  structure: null,

  async loadStructure() {
    try {
      set({ error: null, loading: true });
      set({ loading: false, structure: await enterpriseService.getStructure() });
    } catch (error) {
      set({ error: toErrorMessage(error), loading: false });
    }
  },

  async createOrganization(name) {
    try {
      set({ error: null });
      await enterpriseService.createOrganization({ name: name.trim() });
      await get().loadStructure();
      return true;
    } catch (error) {
      set({ error: toErrorMessage(error) });
      return false;
    }
  },

  async createDepartment(input) {
    try {
      set({ error: null });
      await enterpriseService.createDepartment({ ...input, name: input.name.trim() });
      await get().loadStructure();
      return true;
    } catch (error) {
      set({ error: toErrorMessage(error) });
      return false;
    }
  },

  async updateOrganization(id, input) {
    try {
      set({ error: null });
      await enterpriseService.updateOrganization(id, input);
      await get().loadStructure();
      return true;
    } catch (error) {
      set({ error: toErrorMessage(error) });
      return false;
    }
  },

  async updateDepartment(id, input) {
    try {
      set({ error: null });
      await enterpriseService.updateDepartment(id, input);
      await get().loadStructure();
      return true;
    } catch (error) {
      set({ error: toErrorMessage(error) });
      return false;
    }
  },
}));
