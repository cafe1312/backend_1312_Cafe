/**
 * Calculate driving or straight-line distance between two coordinates.
 * Order of preference:
 * 1. OSRM Road Distance API (OpenStreetMap-based driving routes - Free, no key needed)
 * 2. Haversine Straight-line Distance (fallback)
 */
async function calculateRoadDistance(lat1, lon1, lat2, lon2) {
  // 1. OSRM Road Distance API (Driving)
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes[0]) {
        const osrmDist = data.routes[0].distance / 1000; // Convert meters to km
        if (!isNaN(osrmDist)) {
          console.log(`[Distance] Calculated via OSRM (OpenStreetMap): ${osrmDist.toFixed(2)} km`);
          return osrmDist;
        }
      }
    }
  } catch (err) {
    console.error('[Distance] OSRM API call failed, falling back to Haversine:', err.message);
  }

  // 2. Haversine Straight-line Distance (Fallback)
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const haversineDist = R * c;

  console.log(`[Distance] Calculated via Haversine (Fallback): ${haversineDist.toFixed(2)} km`);
  return haversineDist;
}

module.exports = { calculateRoadDistance };
