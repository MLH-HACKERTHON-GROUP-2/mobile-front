export async function shareQrImage(base64: string, name: string) {
  const link = document.createElement('a');
  link.href = `data:image/png;base64,${base64}`;
  link.download = `${name}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
