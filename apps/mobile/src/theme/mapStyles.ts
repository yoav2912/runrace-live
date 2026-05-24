/** Dark map style with visible roads (Snazzy Maps – subtle night) */
export const RUNRACE_DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a2332' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0e14' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b9bb4' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#b8c5d6' }],
  },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f8a9e' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#15202b' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#5a7a6a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a3a4f' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1e2a3a' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9cb3c9' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3d5168' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2a3d52' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#c5d4e3' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1f2d3d' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#7a90a8' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1520' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d5a6e' }] },
];
