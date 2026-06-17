import React from 'react';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { AppTabParamList } from '../../../navigation/types';
import { CameraScreen } from './CameraScreen';

type CameraHomeNavigationProp = BottomTabNavigationProp<AppTabParamList, 'CameraTab'>;

export const CameraHomeScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<CameraHomeNavigationProp>();

  const handleClose = () => {
    navigation.navigate('TimelineTab');
  };

  const handleCreated = () => {
    navigation.navigate('TimelineTab');
  };

  if (!isFocused) {
    // Unmount CameraScreen when tab is not focused to release camera hardware
    return null;
  }

  return (
    <CameraScreen
      onClose={handleClose}
      onCreated={handleCreated}
    />
  );
};
