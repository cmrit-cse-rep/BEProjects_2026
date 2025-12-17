import { Capacitor } from '@capacitor/core';

export const isMobile = () => Capacitor.isNativePlatform();
export const isWeb = () => !Capacitor.isNativePlatform();
