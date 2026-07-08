import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { EnterpriseRepository } from './enterprise.repository';
import type {
  DepartmentEntity,
  EnterpriseContextEntity,
  OrganizationEntity,
  TenantEntity,
} from './enterprise.types';

@Injectable()
export class EnterpriseService {
  constructor(private readonly enterpriseRepository: EnterpriseRepository) {}

  getContext(context: ExecutionContext): Promise<EnterpriseContextEntity> {
    return this.enterpriseRepository.findUserEnterpriseContext(context.userId);
  }

  async getCurrentTenant(context: ExecutionContext): Promise<TenantEntity | null> {
    return context.tenantId ? this.enterpriseRepository.findTenantById(context.tenantId) : null;
  }

  listDepartments(context: ExecutionContext): Promise<DepartmentEntity[]> {
    return context.tenantId
      ? this.enterpriseRepository.listDepartmentsByTenant(context.tenantId)
      : Promise.resolve([]);
  }

  listOrganizations(context: ExecutionContext): Promise<OrganizationEntity[]> {
    return context.tenantId
      ? this.enterpriseRepository.listOrganizationsByTenant(context.tenantId)
      : Promise.resolve([]);
  }
}
