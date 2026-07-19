import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

interface BrandMarkProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function BrandMark({ size = 112, style }: BrandMarkProps) {
  return (
    <Image
      accessibilityIgnoresInvertColors
      accessible={false}
      resizeMode="contain"
      source={require('../../../assets/brand/brand-mark.png')}
      style={[styles.mark, { height: size, width: size }, style]}
    />
  );
}

const styles = StyleSheet.create({
  mark: { alignSelf: 'center' },
});
