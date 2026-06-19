import type { RenderModule, RenderContext } from "../../types/render";
import * as d3 from "d3";
import { gsap } from "gsap";

interface EarthquakeEvent {
  id: string;
  magnitude: number;
  depth: number;
  lat: number;
  lon: number;
  place: string;
  time: string;
}

interface EarthquakesData {
  generated: string;
  count: number;
  events: EarthquakeEvent[];
}

type ChartParams = {
  minMagnitude?: number;
  sortBy?: "depth" | "time" | "magnitude";
  sortDir?: "asc" | "desc";
  maxAge?: number;
};

let currentParams: ChartParams = {};

const DEPTH_SCALE = d3
  .scaleLinear<string>()
  .domain([0, 70, 300, 700])
  .range(["#D89A4E", "#60a5fa", "#4ade80", "#c084fc"])
  .clamp(true);

const MAG_SCALE = d3.scaleSqrt().domain([0, 8]).range([2, 28]).clamp(true);

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m ago`;
  return `${m}m ago`;
}

function depthLabel(depth: number): string {
  if (depth < 70) return "shallow crust";
  if (depth < 300) return "intermediate";
  return "deep mantle";
}

function render(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  events: EarthquakeEvent[],
  width: number,
  height: number,
  params: ChartParams,
  tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>
) {
  svg.selectAll("*").remove();

  const now = Date.now();
  const maxAge = 24 * 3600 * 1000;

  let filtered = events;
  if (params.minMagnitude != null) {
    filtered = filtered.filter((e) => e.magnitude >= params.minMagnitude!);
  }
  if (params.maxAge != null) {
    filtered = filtered.filter(
      (e) => now - new Date(e.time).getTime() <= params.maxAge! * 1000
    );
  }
  if (params.sortBy === "depth") {
    filtered = [...filtered].sort((a, b) =>
      params.sortDir === "asc" ? a.depth - b.depth : b.depth - a.depth
    );
  } else if (params.sortBy === "time") {
    filtered = [...filtered].sort((a, b) =>
      params.sortDir === "desc"
        ? new Date(b.time).getTime() - new Date(a.time).getTime()
        : new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  }

  const cx = width / 2;
  const cy = height / 2;
  const rings = 4;
  const maxR = Math.min(cx, cy) - 30;
  const ringStep = maxR / rings;

  // Hour rings
  const ringG = svg.append("g");
  for (let i = 1; i <= rings; i++) {
    ringG
      .append("circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", ringStep * i)
      .attr("fill", "none")
      .attr("stroke", "#2A2B30")
      .attr("stroke-width", 0.5);
    ringG
      .append("text")
      .attr("x", cx)
      .attr("y", cy - ringStep * i - 4)
      .attr("text-anchor", "middle")
      .attr("font-family", "var(--font-mono, monospace)")
      .attr("font-size", 10)
      .attr("fill", "#6F6D63")
      .text(`${i * 6}h`);
  }

  // Center dot
  svg
    .append("circle")
    .attr("cx", cx)
    .attr("cy", cy)
    .attr("r", 3)
    .attr("fill", "#6F6D63");

  // Plot events in radial layout: angle = magnitude bucket, radius = age
  const dotsG = svg.append("g");
  const angleScale = d3.scaleLinear().domain([0, filtered.length]).range([0, 2 * Math.PI]);

  filtered.forEach((ev, i) => {
    const age = now - new Date(ev.time).getTime();
    const ageRatio = Math.min(age / maxAge, 1);
    const radius = ageRatio * maxR;
    const angle = angleScale(i) - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    const r = MAG_SCALE(ev.magnitude);
    const opacity = 1 - ageRatio * 0.7;
    const color = DEPTH_SCALE(ev.depth);

    const dot = dotsG
      .append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", 0)
      .attr("fill", color)
      .attr("fill-opacity", opacity)
      .attr("stroke", color)
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", opacity * 0.5)
      .attr("cursor", "pointer")
      .attr("data-id", ev.id);

    gsap.to(dot.node()!, {
      attr: { r },
      duration: 0.4,
      delay: i * 0.008,
      ease: "back.out(1.7)",
    });

    dot
      .on("mouseenter", function (event: MouseEvent) {
        d3.select(this).attr("stroke-width", 2).attr("stroke", "#F4F2EA");
        tooltip
          .style("opacity", "1")
          .html(
            `<strong>${ev.place}</strong><br>
             M${ev.magnitude.toFixed(1)} · ${ev.depth} km depth · ${depthLabel(ev.depth)}<br>
             ${formatTime(ev.time)}`
          )
          .style("left", `${(event as MouseEvent).offsetX + 12}px`)
          .style("top", `${(event as MouseEvent).offsetY - 8}px`);
      })
      .on("mousemove", function (event: MouseEvent) {
        tooltip
          .style("left", `${(event as MouseEvent).offsetX + 12}px`)
          .style("top", `${(event as MouseEvent).offsetY - 8}px`);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("stroke-width", 0.5).attr("stroke", color);
        tooltip.style("opacity", "0");
      });
  });

  // Legend
  const legendG = svg.append("g").attr("transform", `translate(16, ${height - 80})`);
  const legendData: Array<{ label: string; color: string }> = [
    { label: "shallow (0–70 km)", color: "#D89A4E" },
    { label: "intermediate (70–300 km)", color: "#60a5fa" },
    { label: "deep (300+ km)", color: "#4ade80" },
  ];
  legendData.forEach((d, i) => {
    legendG
      .append("circle")
      .attr("cx", 6)
      .attr("cy", i * 18)
      .attr("r", 5)
      .attr("fill", d.color)
      .attr("fill-opacity", 0.8);
    legendG
      .append("text")
      .attr("x", 16)
      .attr("y", i * 18 + 4)
      .attr("font-family", "var(--font-mono, monospace)")
      .attr("font-size", 10)
      .attr("fill", "#9A988F")
      .text(d.label);
  });
}

const earthquakesModule: RenderModule<EarthquakesData> = {
  mount(ctx: RenderContext<EarthquakesData>) {
    const { container, data } = ctx;

    const wrapper = d3.select(container);
    wrapper.style("position", "relative");

    const tooltip = wrapper
      .append("div")
      .style("position", "absolute")
      .style("background", "#16171C")
      .style("border", "1px solid #2A2B30")
      .style("border-radius", "4px")
      .style("padding", "8px 12px")
      .style("font-family", "var(--font-mono, monospace)")
      .style("font-size", "12px")
      .style("color", "#F4F2EA")
      .style("pointer-events", "none")
      .style("opacity", "0")
      .style("transition", "opacity 120ms")
      .style("max-width", "240px")
      .style("line-height", "1.5")
      .style("z-index", "10");

    const svg = wrapper
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .style("display", "block");

    const rect = container.getBoundingClientRect();
    let w = rect.width || 600;
    let h = rect.height || 500;

    svg.attr("viewBox", `0 0 ${w} ${h}`);
    render(svg, data.events, w, h, currentParams, tooltip);

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      w = entry.contentRect.width;
      h = entry.contentRect.height;
      svg.attr("viewBox", `0 0 ${w} ${h}`);
      render(svg, data.events, w, h, currentParams, tooltip);
    });
    ro.observe(container);

    // Expose lens update function on container for lens pills
    (container as HTMLElement & { updateLens?: (p: ChartParams) => void }).updateLens = (
      params: ChartParams
    ) => {
      currentParams = params;
      render(svg, data.events, w, h, currentParams, tooltip);
    };

    return () => {
      ro.disconnect();
      wrapper.selectAll("*").remove();
    };
  },
};

export default earthquakesModule;
