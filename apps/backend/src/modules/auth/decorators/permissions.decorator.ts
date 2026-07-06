import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_METADATA_KEY } from './authorization-metadata';

export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_METADATA_KEY, permissions);
