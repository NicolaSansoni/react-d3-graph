/** App.js */
import React, { useMemo } from "react";
import { Graph } from "./Graph";

interface INode {
  id: number;
}

interface ILink {
  id: number;
  connections: number[];
}

const createNodes = (count: number) => {
  let nodes = [] as INode[];
  for (let i = 0; i < count; i++) nodes.push({ id: i });
  return nodes;
};

const createLinks = (
  count: number,
  nodes: INode[],
  hyperlinkProbability: number
) => {
  const nodesLen = nodes.length;
  let links = [] as ILink[];
  for (let i = 0; i < count; i++) {
    const link = { id: i, connections: [] } as ILink;
    while (true) {
      const target = nodes.at(Math.floor(Math.random() * nodesLen))!.id;
      link.connections.push(target);
      if (Math.random() > hyperlinkProbability) break;
    }
    links.push(link);
  }
  return links;
};

export default function App() {
  const nodes = useMemo(() => createNodes(20), []);
  const links = useMemo(() => createLinks(100, nodes, 0.3), [nodes]);

  const _nodes = useMemo(() => {
    return [
      ...links.map((l) => ({ id: "l" + l.id, type: "l" })),
      ...nodes.map((n) => ({ id: "n" + n.id, type: "n" })),
    ];
  }, [nodes, links]);

  const _links = useMemo(() => {
    return links.flatMap((l) =>
      l.connections.map((c) => ({ source: "l" + l.id, target: "n" + c }))
    );
  }, [links]);

  return (
    <div className="App">
      <Graph nodes={_nodes} links={_links} />
    </div>
  );
}
