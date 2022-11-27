import * as d3 from "d3";
import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (flag.current) return;
    flag.current = true;

    const svg = d3.select<SVGSVGElement, INode>(svgRef.current!);
    svg.selectAll("*").remove();

    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#213")
      // //@ts-ignore
      // .attr("stroke", getLinkColor)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round");

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", getRadius)
      .attr("fill", getFillColor)
      .attr("stroke", getStrokeColor)
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", -5);

    node.append("title").text(({ id }) => id);

    const repulsionForce = d3
      .forceManyBody<INode>()
      .strength((n) => (isNode(n) ? -500 : 0));

    const linkForce = d3.forceLink<INode, ILink>(links).id((n) => n.id);

    const collisionForce = d3.forceCollide<INode>((n) => getRadius(n) + 3);

    const tick = () => {
      node // fmt
        .attr("cx", (d) => d.x || 0)
        .attr("cy", (d) => d.y || 0);

      link
        .attr("x1", (d) => (d.source as unknown as INode)?.x || 0)
        .attr("y1", (d) => (d.source as unknown as INode)?.y || 0)
        .attr("x2", (d) => (d.target as unknown as INode)?.x || 0)
        .attr("y2", (d) => (d.target as unknown as INode)?.y || 0);
    };

    const simulation = d3
      .forceSimulation(nodes)
      .force("charge", repulsionForce)
      .force("link", linkForce)
      .force("x", d3.forceX(width / 2))
      .force("y", d3.forceY(height / 2))
      .force("collision", collisionForce)
      .force("boundary", forceBoundary(0, 0, width, height, getRadius))
      .on("tick", tick);

    const drag = (simulation: d3.Simulation<INode, ILink>) => {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3
        .drag<any, INode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    };

    node.call(drag(simulation));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <svg className="graph" ref={svgRef} width={width} height={height} />;
}

function isNode(n: INode | undefined) {
  return n?.type === "n";
}

function getRadius(n: INode | undefined) {
  return isNode(n) ? 15 : 5;
}

function getFillColor(n: INode | undefined) {
  return isNode(n) ? "#f66" : "#66f";
}

function getStrokeColor(n: INode | undefined) {
  return isNode(n) ? "#833" : "#338";
}

// function getLinkColor({ source, target }: { source: INode; target: INode }) {
//   return source.index && source.index % 2 ? "#0a0" : "#a0a";
// }
