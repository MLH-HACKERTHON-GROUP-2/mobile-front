import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
export async function shareQrImage(base64: string, name: string) {
  if (!(await Sharing.isAvailableAsync()) || !FileSystem.cacheDirectory) throw new Error('Sharing unavailable');
  const uri = `${FileSystem.cacheDirectory}${name}.png`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Share your patient access code' });
}
