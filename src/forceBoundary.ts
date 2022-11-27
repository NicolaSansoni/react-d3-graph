import { Force, SimulationLinkDatum, SimulationNodeDatum } from "d3";

type Extractor<N extends SimulationNodeDatum> = (
  n?: N,
  i?: number,
  arr?: N[]
) => number;

export function forceBoundary<N extends SimulationNodeDatum>(
  left: number,
  top: number,
  right: number,
  bottom: number,
  radius: number | Extractor<N> = 0
): Force<N, SimulationLinkDatum<N>> {
  let _nodes: N[];
  let _radii: number[] = [];

  const _radius =
    typeof radius !== "function" ? () => (radius ? +radius : 0) : radius;

  function force() {
    for (let i = 0; i < _nodes.length; i++) {
      const n = _nodes[i];
      const x = n.x!;
      const y = n.y!;
      const r = _radii[i];
      if (x - r < left) n.x = left + r;
      if (x + r > right) n.x = right - r;
      if (y - r < top) n.y = top + r;
      if (y + r > bottom) n.y = bottom - r;
    }
  }

  force.initialize = (nodes: N[]) => {
    _nodes = nodes;
    if (!_nodes) return;

    for (let i = 0; i < _nodes.length; i++) {
      const n = _nodes[i];
      _radii[i] = _radius(n);
    }
  };

  // TODO: set like in https://github.com/d3/d3-force/blob/main/src/x.js
  // force.left = ;
  // force.top = ;
  // force.right = ;
  // force.bottom = ;
  // force.radius = ;

  return force;
}
