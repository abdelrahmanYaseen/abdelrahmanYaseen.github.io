The Earth never stops moving. In any given 24-hour period, the USGS Earthquake
Hazards Program typically records between 100 and 500 seismic events worldwide —
most imperceptible to humans, some capable of reshaping coastlines overnight.

This visualization maps every event from the past day reported in the USGS
all-day GeoJSON feed, updated every 15 minutes. Each circle encodes three
simultaneous variables: its size corresponds to magnitude on the Richter scale
(where a magnitude-5 quake releases roughly 32 times more energy than a
magnitude-4), its color encodes focal depth (shallow crust events in warm amber,
deep mantle events in cool blue), and its opacity fades as the event ages,
creating a natural "recency glow" that makes recent activity visually dominant.

The radial layout clusters events by hour of occurrence rather than geography —
the goal is to make the *rhythm* of Earth's seismicity visible. For geographic
context, hover any event to see its location and coordinates.

**Methodology:** Data streams directly from the USGS GeoJSON feed
(`/v1.0/summary/all_day.geojson`), which is documented as public domain. Events
with no magnitude reported are excluded. The transform script normalizes
timestamps to UTC, clips magnitude to a [0, 8] display range, and buckets depth
into three bands (shallow: 0–70 km, intermediate: 70–300 km, deep: 300+ km).

**Source:** [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/)
