export function formatBytes(bytes: number, locale?: string): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const value = bytes / k ** i;
  const formattedValue = value.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${formattedValue} ${sizes[i]}`;
}
