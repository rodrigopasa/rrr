declare module 'qrcode' {
  export function toDataURL(text: string, callback: (err: any, url: string) => void): void;
  export function toDataURL(text: string, options: any, callback: (err: any, url: string) => void): void;
  export function toFile(path: string, text: string, callback: (err: any) => void): void;
  export function toFile(path: string, text: string, options: any, callback: (err: any) => void): void;
  export function toString(text: string, callback: (err: any, string: string) => void): void;
  export function toString(text: string, options: any, callback: (err: any, string: string) => void): void;
}