import type { RenderModule, RenderContext } from "../../types/render";
import * as d3 from "d3";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface NuclearTest {
  id: number;
  name: string;
  country: string;
  date: string;
  yield_kt: number;
  medium: string;
  lat: number;
  lon: number;
  site: string;
}

interface NuclearData {
  totalTests: number;
  dateRange: { start: string; end: string };
  tests: NuclearTest[];
}

type ChartParams = {
  highlightCountries?: string[];
  yearRange?: [number, number];
  colorBy?: "country" | "medium";
  view?: "timeline" | "geographic";
};

const COUNTRY_COLORS: Record<string, string> = {
  USA: "#60a5fa",
  USSR: "#f87171",
  UK: "#4ade80",
  France: "#a78bfa",
  China: "#fb923c",
  India: "#D89A4E",
  Pakistan: "#34d399",
  "North Korea": "#c084fc",
};

const MEDIUM_COLORS: Record<string, string> = {
  atmospheric: "#f87171",
  underground: "#60a5fa",
  underwater: "#4ade80",
  "air burst": "#fb923c",
  Unknown: "#6F6D63",
};

function yieldRadius(kt: number): number {
  return Math.max(3, Math.min(40, Math.sqrt(kt / 20) * 4));
}

const nuclearModule: RenderModule<NuclearData> = {
  mount(ctx: RenderContext<NuclearData>) {
    const { container, data, reducedMotion } = ctx;
    let params: ChartParams = {};

    const wrapper = d3.select(container);
    wrapper.style("position", "relative");

    const tooltip = wrapper
      .append("div")
      .style("position", "absolute")
      .style("background", "#16171C")
      .style("border", "1px solid #2A2B30")
      .style("border-radius", "4px")
      .style("padding", "10px 14px")
      .style("font-family", "var(--font-mono, monospace)")
      .style("font-size", "12px")
      .style("color", "#F4F2EA")
      .style("pointer-events", "none")
      .style("opacity", "0")
      .style("transition", "opacity 120ms")
      .style("max-width", "260px")
      .style("line-height", "1.6")
      .style("z-index", "10");

    // Timeline SVG
    const svg = wrapper
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .style("display", "block");

    function draw(w: number, h: number) {
      svg.selectAll("*").remove();
      ScrollTrigger.getAll().forEach((st) => st.kill());

      const colorBy = params.colorBy ?? "country";
      const colorMap = colorBy === "country" ? COUNTRY_COLORS : MEDIUM_COLORS;
      const highlightCountries = params.highlightCountries;
      const [yearMin, yearMax] = params.yearRange ?? [1945, 2020];

      let tests = data.tests.filter((t) => {
        const y = parseInt(t.date.slice(0, 4));
        return y >= yearMin && y <= yearMax;
      });

      const margin = { top: 40, right: 24, bottom: 48, left: 24 };
      const iw = w - margin.left - margin.right;
      const ih = h - margin.top - margin.bottom;

      const xScale = d3
        .scaleTime()
        .domain([new Date(yearMin, 0, 1), new Date(yearMax, 11, 31)])
        .range([0, iw]);

      // Spread tests vertically by country slot
      const countries = [...new Set(tests.map((t) => t.country))];
      const yScale = d3.scalePoint().domain(countries).range([ih * 0.1, ih * 0.9]).padding(0.5);

      const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      // Axis
      const xAxis = d3
        .axisBottom(xScale)
        .ticks(8)
        .tickFormat((d) => d3.timeFormat("%Y")(d as Date));

      g.append("g")
        .attr("transform", `translate(0, ${ih})`)
        .call(xAxis)
        .call((ax) => {
          ax.select(".domain").attr("stroke", "#2A2B30");
          ax.selectAll(".tick line").attr("stroke", "#2A2B30");
          ax.selectAll(".tick text")
            .attr("fill", "#6F6D63")
            .attr("font-family", "var(--font-mono, monospace)")
            .attr("font-size", 10);
        });

      // Country labels
      countries.forEach((country) => {
        g.append("text")
          .attr("x", -margin.left + 4)
          .attr("y", (yScale(country) ?? 0) + 4)
          .attr("font-family", "var(--font-mono, monospace)")
          .attr("font-size", 9)
          .attr("fill", COUNTRY_COLORS[country] ?? "#6F6D63")
          .text(country);
      });

      // Tests
      const dots = g.selectAll("circle.test").data(tests).enter().append("circle");

      dots
        .attr("class", "test")
        .attr("cx", (d) => xScale(new Date(d.date)))
        .attr("cy", (d) => yScale(d.country) ?? ih / 2)
        .attr("r", 0)
        .attr("fill", (d) => colorMap[colorBy === "country" ? d.country : d.medium] ?? "#6F6D63")
        .attr("fill-opacity", (d) => {
          if (highlightCountries && !highlightCountries.includes(d.country)) return 0.15;
          return 0.75;
        })
        .attr("cursor", "pointer");

      dots
        .on("mouseenter", function (event: MouseEvent, d) {
          d3.select(this).attr("stroke", "#F4F2EA").attr("stroke-width", 1.5);
          tooltip
            .style("opacity", "1")
            .html(
              `<strong>${d.name}</strong><br>
               ${d.country} · ${d.date}<br>
               ${d.yield_kt >= 1000 ? (d.yield_kt / 1000).toFixed(1) + " MT" : d.yield_kt + " kt"}<br>
               ${d.medium} · ${d.site}`
            )
            .style("left", `${event.offsetX + 12}px`)
            .style("top", `${event.offsetY - 8}px`);
        })
        .on("mousemove", function (event: MouseEvent) {
          tooltip.style("left", `${event.offsetX + 12}px`).style("top", `${event.offsetY - 8}px`);
        })
        .on("mouseleave", function (_, d) {
          d3.select(this).attr("stroke", "none");
          tooltip.style("opacity", "0");
        });

      if (reducedMotion) {
        dots.attr("r", (d) => yieldRadius(d.yield_kt));
        return;
      }

      // ScrollTrigger: reveal dots left to right as user scrolls
      const sortedDots = dots
        .nodes()
        .map((node, i) => ({ node, test: tests[i] }))
        .sort(
          (a, b) => new Date(a.test.date).getTime() - new Date(b.test.date).getTime()
        );

      sortedDots.forEach(({ node, test }, i) => {
        gsap.to(node, {
          attr: { r: yieldRadius(test.yield_kt) },
          duration: 0.3,
          scrollTrigger: {
            trigger: container,
            start: `top+=${(i / sortedDots.length) * 80}% center`,
            toggleActions: "play none none reverse",
          },
        });
      });
    }

    const rect = container.getBoundingClientRect();
    let w = rect.width || 700;
    let h = Math.max(rect.height, 360);
    svg.attr("viewBox", `0 0 ${w} ${h}`);
    draw(w, h);

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      w = entry.contentRect.width;
      h = Math.max(entry.contentRect.height, 360);
      svg.attr("viewBox", `0 0 ${w} ${h}`);
      draw(w, h);
    });
    ro.observe(container);

    (container as HTMLElement & { updateLens?: (p: ChartParams) => void }).updateLens = (
      p: ChartParams
    ) => {
      params = { ...params, ...p };
      draw(w, h);
    };

    return () => {
      ro.disconnect();
      ScrollTrigger.getAll().forEach((st) => st.kill());
      wrapper.selectAll("*").remove();
    };
  },
};

export default nuclearModule;
