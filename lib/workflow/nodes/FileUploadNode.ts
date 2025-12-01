/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext } from '@/lib/types';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export class FileUploadNode extends BaseNode {
  validate(config: any): void {
    if (!config.fileName) throw new Error('File name is required');
    if (!config.content) throw new Error('File content is required');

    if (
      config.fileName.includes('..') ||
      config.fileName.includes('/') ||
      config.fileName.includes('\\')
    ) {
      throw new Error('Invalid file name');
    }
  }

  async execute(_: NodeExecutionContext): Promise<any> {
    const { fileName, content, folder = 'uploads' } = this.config;

    try {
      const uploadsDir = join(process.cwd(), 'public', folder);
      await mkdir(uploadsDir, { recursive: true });

      const uniqueId = uuidv4();
      const uniqueFileName = `${uniqueId}_${fileName}`;
      const filePath = join(uploadsDir, uniqueFileName);

      await writeFile(filePath, content, 'utf8');

      return {
        success: true,
        fileName: uniqueFileName,
        originalName: fileName,
        path: `/${folder}/${uniqueFileName}`,
        size: Buffer.byteLength(content, 'utf8'),
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `File upload failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}