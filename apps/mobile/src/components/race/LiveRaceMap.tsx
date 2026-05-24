import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import type { RacerState } from '@runrace/shared';
import { HAS_VALID_GOOGLE_MAPS_KEY, PREFER_GOOGLE_MAPS } from '@/config/maps';
import { useLiveGpsStore } from '@/store/liveGpsStore';
import { RUNRACE_DARK_MAP_STYLE } from '@/theme/mapStyles';
import { colors, spacing } from '@/theme/colors';

interface Props {
  racers: RacerState[];
  userId?: string;
}

function hasValidCoord(lat: number, lng: number): boolean {
  return lat !== 0 && lng !== 0 && Number.isFinite(lat) && Number.isFinite(lng);
}

const DEFAULT_REGION: Region = {
  latitude: 32.0853,
  longitude: 34.7818,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

export function LiveRaceMap({ racers, userId }: Props) {
  const mapRef = useRef<MapView>(null);
  const localGps = useLiveGpsStore();
  const [mapReady, setMapReady] = useState(false);
  const [initialRegion, setInitialRegion] = useState<Region>(DEFAULT_REGION);

  const mapProvider = PREFER_GOOGLE_MAPS ? PROVIDER_GOOGLE : undefined;
  const useGoogleStyle = PREFER_GOOGLE_MAPS && HAS_VALID_GOOGLE_MAPS_KEY;

  const racerPoints = useMemo(() => {
    return racers
      .filter((r) => hasValidCoord(r.lat, r.lng))
      .map((r) => ({
        racer: r,
        latitude: r.lat,
        longitude: r.lng,
        isMe: r.userId === userId,
      }));
  }, [racers, userId]);

  const myPoint = useMemo(() => {
    const server = racerPoints.find((p) => p.isMe);
    if (server) return server;
    if (hasValidCoord(localGps.lat, localGps.lng)) {
      return {
        racer: racers.find((r) => r.userId === userId),
        latitude: localGps.lat,
        longitude: localGps.lng,
        isMe: true,
      };
    }
    return null;
  }, [racerPoints, localGps.lat, localGps.lng, racers, userId]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const region: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        };
        setInitialRegion(region);
        useLiveGpsStore.getState().setPosition(
          loc.coords.latitude,
          loc.coords.longitude,
          loc.coords.speed ?? 0,
          loc.coords.heading ?? null,
        );
      } catch {
        /* keep default TLV */
      }
    })();
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const coords: { latitude: number; longitude: number }[] = racerPoints.map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
    }));

    if (myPoint && !coords.some((c) => c.latitude === myPoint.latitude)) {
      coords.push({ latitude: myPoint.latitude, longitude: myPoint.longitude });
    }

    if (coords.length === 0) return;

    if (coords.length === 1) {
      mapRef.current.animateToRegion(
        {
          ...coords[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        400,
      );
      return;
    }

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 120, right: 48, bottom: 200, left: 48 },
      animated: true,
    });
  }, [racerPoints, myPoint, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !myPoint) return;
    mapRef.current.animateCamera(
      {
        center: { latitude: myPoint.latitude, longitude: myPoint.longitude },
        zoom: 16,
      },
      { duration: 600 },
    );
  }, [myPoint?.latitude, myPoint?.longitude, mapReady]);

  const showMapsKeyWarning = Platform.OS === 'android' && !HAS_VALID_GOOGLE_MAPS_KEY;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={mapProvider}
        customMapStyle={useGoogleStyle ? RUNRACE_DARK_MAP_STYLE : undefined}
        userInterfaceStyle="dark"
        mapType="standard"
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        showsBuildings
        showsTraffic={false}
        rotateEnabled
        pitchEnabled={false}
        onMapReady={() => setMapReady(true)}
      >
        {racerPoints.map((p) => (
          <Marker
            key={p.racer.userId}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={[styles.marker, p.isMe ? styles.markerMe : styles.markerOpponent]}>
              <View style={[styles.markerInner, p.isMe ? styles.markerInnerMe : styles.markerInnerOpponent]} />
            </View>
          </Marker>
        ))}
      </MapView>

      {showMapsKeyWarning && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningTitle}>מפת Google לא מוגדרת</Text>
          <Text style={styles.warningText}>
            הוסף EXPO_PUBLIC_GOOGLE_MAPS_API_KEY בקובץ .env ובנה מחדש את האפליקציה
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,14,20,0.7)',
  },
  markerMe: {
    borderColor: colors.neon,
  },
  markerOpponent: {
    borderColor: colors.neonAlt,
  },
  markerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  markerInnerMe: {
    backgroundColor: colors.neon,
  },
  markerInnerOpponent: {
    backgroundColor: colors.neonAlt,
  },
  warningBanner: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(255,77,109,0.92)',
    borderRadius: 12,
    padding: spacing.md,
  },
  warningTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 4,
  },
  warningText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 18,
  },
});
