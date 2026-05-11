import { ref, onMounted, onUnmounted } from 'vue';
import type { GPSPoint } from '../types/gps';

export function useGeolocation() {
  const currentPoint = ref<GPSPoint | null>(null);
  const error = ref<string | null>(null);
  let watcherId: number | null = null;

  const startWatching = () => {
    if (!navigator.geolocation) {
      error.value = "Geolocation not supported";
      return;
    }

    watcherId = navigator.geolocation.watchPosition(
      (pos) => {
        currentPoint.value = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
      },
      (err) => { error.value = err.message; },
      { 
        enableHighAccuracy: true, // Forces GPS over Wi-Fi/Cell triangulation
        timeout: 10000, 
        maximumAge: 0 
      }
    );
  };

  onMounted(startWatching);
  onUnmounted(() => {
    if (watcherId !== null) navigator.geolocation.clearWatch(watcherId);
  });

  return { currentPoint, error };
}
