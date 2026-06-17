/**
 * navigationRef — a container-level ref so non-screen UI (e.g. the global side
 * drawer overlay) can trigger navigation without sitting inside a screen's
 * navigation context. Attached to <NavigationContainer> in RootNavigator.
 */
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/** Navigate by route name if the container is mounted and ready. */
export function navigate(name, params) {
  if (navigationRef.isReady()) navigationRef.navigate(name, params);
}
