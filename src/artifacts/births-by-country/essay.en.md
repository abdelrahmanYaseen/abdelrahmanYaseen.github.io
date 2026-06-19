About 132 million babies are born each year — one every quarter-second. But the
distribution is anything but uniform. India alone accounts for roughly 17% of
global births; the entire continent of Europe contributes less than 7%. This
Voronoi treemap lets you see that imbalance at a glance: each country's cell
area is directly proportional to its share of the global total.

The Voronoi treemap algorithm (d3-voronoi-treemap) is a space-filling technique
that avoids the rigid rectangular shapes of conventional treemaps, producing
organic, country-shaped cells that feel more like territory than bar charts.
Each cell contains the country's flag, rendered from the flag-icons CSS library.
Hover a cell to see the country's raw birth count, its crude birth rate per
1,000 population, and the 5-year trend direction.

The colors encode world region (not magnitude) — a deliberate choice to make
the geographic clustering legible: you can immediately see that sub-Saharan
Africa and South Asia dominate the lower-right region by area, while wealthy
OECD nations shrink toward invisibility.

**Methodology:** Birth count data comes from the World Bank's `SP.DYN.CBRT.IN`
indicator (crude birth rate × population), using the most recently available
annual figure for each country. Countries with no World Bank data are excluded.
A daily cron job checks for updated figures, though in practice the World Bank
updates this series once per year following national statistical releases.

**Source:** [World Bank Open Data](https://data.worldbank.org/) — CC BY 4.0
