import { SupportedFileType } from '../types/index.ts';

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts.pop()!.toLowerCase();
}

export function detectFileType(file: { name: string; type?: string }): SupportedFileType {
  const ext = getFileExtension(file.name);
  
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) {
    return 'image';
  }
  if (['docx', 'doc'].includes(ext)) {
    return 'word';
  }
  if (ext === 'pdf') {
    return 'pdf';
  }

  // Fallback to mime type
  if (file.type) {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    if (
      file.type.includes('word') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      return 'word';
    }
  }

  return 'unsupported';
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function sanitizeFileName(name: string, fallback: string = 'document'): string {
  const cleaned = name.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return cleaned.length > 0 ? cleaned : fallback;
}
