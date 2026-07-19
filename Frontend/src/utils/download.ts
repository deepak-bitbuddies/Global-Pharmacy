export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadFile(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  const blob = await response.blob();
  downloadBlob(blob, filename);
}
