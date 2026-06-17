import * as ImageManipulator from 'expo-image-manipulator';

export interface CompressedPhoto {
  uri: string;
  width: number;
  height: number;
}

export const compressImage = async (
  uri: string,
  width: number,
  height: number
): Promise<CompressedPhoto> => {
  const actions: ImageManipulator.Action[] = [];
  const maxSize = 1200;

  if (width > maxSize || height > maxSize) {
    if (width > height) {
      actions.push({ resize: { width: maxSize } });
    } else {
      actions.push({ resize: { height: maxSize } });
    }
  }

  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    actions,
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );

  return {
    uri: manipulated.uri,
    width: manipulated.width,
    height: manipulated.height,
  };
};
