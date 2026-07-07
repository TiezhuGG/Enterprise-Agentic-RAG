export interface StoredObject {
  key: string;
  buffer: Buffer;
  contentType?: string;
  size: number;
}

export interface ObjectMetadata {
  key: string;
  contentType?: string;
  size: number;
}
