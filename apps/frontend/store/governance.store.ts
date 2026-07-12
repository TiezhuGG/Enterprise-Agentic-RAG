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
  reset: () => void;
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

  reset() {
    set(initialState);
  },
}));
