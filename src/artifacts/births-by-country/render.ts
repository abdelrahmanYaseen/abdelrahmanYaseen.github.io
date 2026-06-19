import type { RenderModule, RenderContext } from "../../types/render";
import * as d3 from "d3";
import { gsap } from "gsap";

interface CountryBirths {
  code: string;
  name: string;
  births: number;
  rate: number;
  region: string;
  incomeGroup: string;
}

interface BirthsData {
  year: number;
  totalBirths: number;
  countries: CountryBirths[];
}

type ChartParams = {
  sortBy?: "growthRate" | "births";
  highlightTop?: number;
  highlightRegion?: string;
  colorBy?: "region" | "incomeGroup";
};

const REGION_COLORS: Record<string, string> = {
  "South Asia": "#D89A4E",
  "Sub-Saharan Africa": "#f97316",
  "East Asia": "#60a5fa",
  "Latin America": "#4ade80",
  Europe: "#a78bfa",
  MENA: "#fb923c",
  "North America": "#34d399",
  Unknown: "#6F6D63",
};

const INCOME_COLORS: Record<string, string> = {
  low: "#f87171",
  "lower-middle": "#fb923c",
  "upper-middle": "#60a5fa",
  high: "#4ade80",
  unknown: "#6F6D63",
};

function flagUrl(code: string): string {
  return `https://flagcdn.com/48x36/${code.toLowerCase().slice(0, 2)}.png`;
}

function buildSimpleTreemap(
  countries: CountryBirths[],
  width: number,
  height: number,
  colorBy: "region" | "incomeGroup",
  highlightRegion?: string
) {
  const totalBirths = countries.reduce((s, c) => s + c.births, 0);
  const root = d3
    .hierarchy({ name: "root", children: countries })
    .sum((d: CountryBirths & { children?: CountryBirths[] }) => d.births ?? 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const treemap = d3
    .treemap<CountryBirths>()
    .size([width, height])
    .padding(2)
    .round(true);

  treemap(root as d3.HierarchyNode<CountryBirths>);
  return { root, totalBirths };
}

const birthsModule: RenderModule<BirthsData> = {
  mount(ctx: RenderContext<BirthsData>) {
    const { container, data } = ctx;
    let params: ChartParams = { colorBy: "region" };

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
      .style("max-width", "220px")
      .style("line-height", "1.6")
      .style("z-index", "10");

    const svg = wrapper
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .style("display", "block");

    function draw(w: number, h: number) {
      svg.selectAll("*").remove();
      const colorBy = params.colorBy ?? "region";
      const colorMap = colorBy === "region" ? REGION_COLORS : INCOME_COLORS;
      const highlightRegion = params.highlightRegion;

      const { root, totalBirths } = buildSimpleTreemap(
        data.countries,
        w,
        h,
        colorBy,
        highlightRegion
      );

      const cells = (root as d3.HierarchyRectangularNode<unknown>).leaves();

      cells.forEach((leaf, i) => {
        const d = leaf.data as CountryBirths;
        const x = leaf.x0;
        const y = leaf.y0;
        const cw = leaf.x1 - leaf.x0;
        const ch = leaf.y1 - leaf.y0;
        if (cw < 1 || ch < 1) return;

        const colorKey = colorBy === "region" ? d.region : d.incomeGroup;
        const baseColor = colorMap[colorKey] ?? "#6F6D63";
        const dimmed = highlightRegion && d.region.toLowerCase() !== highlightRegion;
        const opacity = dimmed ? 0.25 : 0.85;

        const cellG = svg
          .append("g")
          .attr("transform", `translate(${x}, ${y})`);

        cellG
          .append("rect")
          .attr("width", 0)
          .attr("height", 0)
          .attr("fill", "#16171C")
          .attr("stroke", "#0E0F12")
          .attr("stroke-width", 1)
          .attr("rx", 2);

        gsap.to(cellG.select("rect").node()!, {
          attr: { width: cw, height: ch },
          duration: 0.5,
          delay: i * 0.005,
          ease: "power2.out",
        });

        // Color overlay
        cellG
          .append("rect")
          .attr("width", cw)
          .attr("height", ch)
          .attr("fill", baseColor)
          .attr("fill-opacity", 0)
          .attr("rx", 2);

        gsap.to(cellG.selectAll("rect").nodes()[1]!, {
          attr: { "fill-opacity": opacity * 0.15 },
          duration: 0.5,
          delay: i * 0.005 + 0.2,
          ease: "power2.out",
        });

        // Country code label if cell big enough
        if (cw > 30 && ch > 20) {
          cellG
            .append("text")
            .attr("x", cw / 2)
            .attr("y", ch / 2 + 4)
            .attr("text-anchor", "middle")
            .attr("font-family", "var(--font-mono, monospace)")
            .attr("font-size", Math.min(cw / 3, ch / 2, 14))
            .attr("fill", baseColor)
            .attr("fill-opacity", dimmed ? 0.3 : 0.9)
            .text(d.code);
        }

        // Hover interaction
        const hoverRect = cellG
          .append("rect")
          .attr("width", cw)
          .attr("height", ch)
          .attr("fill", "transparent")
          .attr("cursor", "pointer");

        hoverRect
          .on("mouseenter", function (event: MouseEvent) {
            cellG.select("rect:first-child").attr("stroke", baseColor).attr("stroke-width", 1.5);
            const share = ((d.births / totalBirths) * 100).toFixed(2);
            tooltip
              .style("opacity", "1")
              .html(
                `<strong>${d.name}</strong> (${d.code})<br>
                 ${d.births.toLocaleString()} births<br>
                 ${d.rate.toFixed(1)} per 1,000 pop<br>
                 ${share}% of global total<br>
                 <span style="color:${baseColor}">${colorBy === "region" ? d.region : d.incomeGroup}</span>`
              )
              .style("left", `${event.offsetX + 12}px`)
              .style("top", `${event.offsetY - 8}px`);
          })
          .on("mousemove", function (event: MouseEvent) {
            tooltip.style("left", `${event.offsetX + 12}px`).style("top", `${event.offsetY - 8}px`);
          })
          .on("mouseleave", function () {
            cellG.select("rect:first-child").attr("stroke", "#0E0F12").attr("stroke-width", 1);
            tooltip.style("opacity", "0");
          });
      });
    }

    const rect = container.getBoundingClientRect();
    let w = rect.width || 700;
    let h = rect.height || 500;
    svg.attr("viewBox", `0 0 ${w} ${h}`);
    draw(w, h);

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      w = entry.contentRect.width;
      h = entry.contentRect.height;
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
      wrapper.selectAll("*").remove();
    };
  },
};

export default birthsModule;
