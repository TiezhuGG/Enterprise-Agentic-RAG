'use client';

import { create } from 'zustand';
import { authorizationAuditService } from '@/services/authorization-audit.service';
import type { AuthorizationAuditRole, AuthorizationAuditUser } from '@/types/governance';

interface GovernanceState {
  error: string | null;
  loading: boolean;
  roles: AuthorizationAuditRole[];
  users: AuthorizationAuditUser[];
  loadAuthorizationAudit: () => Promise<void>;
  createUser: (input: { departmentId: string; email: string; name: string; systemRole: 'admin' | 'user'; temporaryPassword: string }) => Promise<boolean>;
  resetUserPassword: (userId: string, temporaryPassword: string) => Promise<boolean>;
  reset: () => void;
  updateUser: (userId: string, input: { departmentId?: string; isActive?: boolean; name?: string; systemRole?: 'admin' | 'user' }) => Promise<boolean>;
}

const initialState = {
  error: null,
  loading: false,
  roles: [] as AuthorizationAuditRole[],
  users: [] as AuthorizationAuditUser[],
};

export const useGovernanceStore = create<GovernanceState>((set) => ({
  ...initialState,

  async loadAuthorizationAudit() {
    try {
      set({ error: null, loading: true });
      const [users, roles] = await Promise.all([
        authorizationAuditService.listUsers(),
        authorizationAuditService.listRoles(),
      ]);
      set({ loading: false, roles, users });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '加载用户与角色信息失败。',
        loading: false,
      });
    }
  },

  async createUser(input) {
    try {
      set({ error: null });
      await authorizationAuditService.createUser(input);
      const [users, roles] = await Promise.all([
        authorizationAuditService.listUsers(),
        authorizationAuditService.listRoles(),
      ]);
      set({ roles, users });
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建用户失败。' });
      return false;
    }
  },

  async updateUser(userId, input) {
    try {
      set({ error: null });
      await authorizationAuditService.updateUser(userId, input);
      const [users, roles] = await Promise.all([
        authorizationAuditService.listUsers(),
        authorizationAuditService.listRoles(),
      ]);
      set({ roles, users });
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新用户失败。' });
      return false;
    }
  },

  async resetUserPassword(userId, temporaryPassword) {
    try {
      set({ error: null });
      await authorizationAuditService.resetUserPassword(userId, temporaryPassword);
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '重置密码失败。' });
      return false;
    }
  },

  reset() {
    set(initialState);
  },
}));
