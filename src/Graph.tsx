import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { forceBoundary } from "./forceBoundary";

interface INode extends d3.SimulationNodeDatum {
  id: string;
  type: string;
}

interface ILink extends d3.SimulationLinkDatum<INode> {
  source: string;
  target: string;
}

interface GraphProps {
  nodes: INode[];
  links: ILink[];
  width?: number;
  height?: number;
}

export function Graph({ nodes, links, width = 600, height = 600 }: GraphProps) {
  const flag = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selection, select] = useState("");
  const boundary = [-width / 2, -height / 2, +width / 2, +height / 2] as const;
  const center = { x: 0, y: 0 };
  let zoomK = useRef(1);
  const getDims = () => ({
    w: width / zoomK.current,
    h: height / zoomK.current,
  });
  const getViewBox = () => {
    const dims = getDims();
    return [center.x - dims.w / 2, center.y - dims.h / 2, dims.w, dims.h];
  };

  useEffect(() => {
    if (flag.current) return;
    flag.current = true;

    const svg = d3
      .select<SVGSVGElement, INode>(svgRef.current!)
      .attr("viewBox", getViewBox());

    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      // .attr("stroke", "#213")
      .attr("stroke", "#a8c")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round");

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join((enter) => {
        const g = enter.append("g");

        g.append("circle")
          .attr("r", getFillThickness)
          .attr("fill", getFillColor)
          .attr("stroke", (n: INode) => getStrokeColor(n, selection))
          .attr("stroke-width", getStrokeThickness)
          .attr("stroke-opacity", 1);

        const n = g.filter((d) => d.type === "n");
        n.append("text")
          .attr("filter", "url(#solid)")
          .attr("font-family", "sans-serif")
          .attr("font-size", "18px")
          .attr("transform", "scale(1)")
          .attr("fill", "white")
          .attr("paint-order", "stroke")
          .attr("stroke", "#000")
          .attr("stroke-width", "2px")
          .attr("stroke-linejoin", "round")
          .attr("dx", "4px")
          .attr("dy", "-6px")
          .text((d) => d.id);

        return g;
      });

    const simulation = d3
      .forceSimulation(nodes)
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .force("boundary", forceBoundary(...boundary, getRadius))
      .force(
        "charge",
        d3.forceManyBody<INode>().strength((n) => (isNode(n) ? -500 : 0))
      )
      .force(
        "link",
        d3.forceLink<INode, ILink>(links).id((n) => n.id)
      )
      .force(
        "collision",
        d3.forceCollide<INode>((n) => getRadius(n) + 2)
      )
      .on("tick", () => {
        node.attr("transform", function (d) {
          return "translate(" + d.x + "," + d.y + ")";
        });

        link
          .attr("x1", (d) => (d.source as unknown as INode)?.x || 0)
          .attr("y1", (d) => (d.source as unknown as INode)?.y || 0)
          .attr("x2", (d) => (d.target as unknown as INode)?.x || 0)
          .attr("y2", (d) => (d.target as unknown as INode)?.y || 0);
      });

    type DragEvent = d3.D3DragEvent<any, INode, any>;
    const drag = (simulation: d3.Simulation<INode, ILink>) => {
      function dragstarted(event: DragEvent) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: DragEvent) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: DragEvent) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3
        .drag<any, INode>()
        .filter((event) => event.button === 0)
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    };

    node.call(drag(simulation));

    type ZoomEvent = d3.D3ZoomEvent<any, null>;
    const zoom = d3
      .zoom<any, INode>()
      .filter((event) => event.type === "wheel")
      .on("zoom", (event: ZoomEvent) => {
        zoomK.current = event.transform.k;
        svg.attr("viewBox", getViewBox());
        d3.selectAll("text").attr(
          "transform",
          `scale(${1 / Math.pow(zoomK.current, 0.8)})`
        );
      });
    svg.call(zoom);

    const pan = d3
      .drag<any, any>()
      .filter((event) => event.button === 1)
      .on("drag", (event: d3.D3DragEvent<any, any, any>) => {
        center.x -= event.dx / zoomK.current;
        center.y -= event.dy / zoomK.current;
        svg.attr("viewBox", getViewBox());
      });
    svg.call(pan);

    const click = (event: MouseEvent, d: INode) => {
      select(d.id);
    };
    node.on("click", click);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    d3.selectAll<any, INode>("circle").attr("stroke", (n: INode) =>
      getStrokeColor(n, selection)
    );
  }, [selection]);

  return (
    <svg className="graph" ref={svgRef} width={width} height={height}>
      <defs>
        <filter id="solid">
          <feFlood floodColor="#000" floodOpacity={0.3} />
          <feComposite in="SourceGraphic" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

function isNode(n: INode | undefined) {
  return n?.type === "n";
}

function getFillThickness(n: INode | undefined) {
  return isNode(n) ? 15 : 5;
}

function getStrokeThickness(n: INode | undefined) {
  return isNode(n) ? 3 : 2;
}

function getRadius(n: INode | undefined) {
  return getFillThickness(n) + getStrokeThickness(n);
}

function getFillColor(n: INode | undefined) {
  return isNode(n) ? "#f66" : "#66f";
}

function getStrokeColor(n: INode | undefined, selection: string) {
  return n?.id === selection ? "#fff" : isNode(n) ? "#833" : "#338";
}
