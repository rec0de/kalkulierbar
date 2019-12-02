import { event, hierarchy, select, tree, zoom } from "d3";
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

import { TableauxNode } from "../../../types/tableaux";
import TableauxTreeNode from "../node";

import * as style from "./style.css";

// Properties Interface for the TableauxTreeView component
interface Props {
    /**
     * The nodes of the tree
     */
    nodes: TableauxNode[];
    /**
     * The id of a node if one is selected
     */
    selectedNodeId: number | undefined;
    /**
     * The function to call, when the user selects a node
     */
    selectNodeCallback: (node: D3Data) => void;
}

// Interface for a node
export interface D3Data {
    id: number;
    name: string;
    isLeaf: boolean;
    negated: boolean;
    isClosed: boolean;
    closeRef: number | null;
    children?: D3Data[];
}

// Creates a tree layout function
const layout = tree();

// Size of the nodes. [width, height]
const NODE_SIZE: [number, number] = [140, 140];

/**
 * Transforms the node data received by the server to data
 * accepted by d3
 * @param {number} id  - the node to transform
 * @param {TableauxNode[]} nodes  - list of all nodes
 * @returns {D3Data} - data as d3 parsable
 */
const transformNodeToD3Data = (id: number, nodes: TableauxNode[]): D3Data => {
    const node = nodes[id];
    const isLeaf = !node.children.length;
    const children = isLeaf
        ? undefined
        : node.children.map(c => transformNodeToD3Data(c, nodes));

    return {
        id,
        name: node.spelling,
        isLeaf,
        children,
        negated: node.negated,
        isClosed: node.isClosed,
        closeRef: node.closeRef
    };
};

interface Transform {
    x: number;
    y: number;
    k: number;
}

// Component displaying nodes as a TableauxTree
const TableauxTreeView: preact.FunctionalComponent<Props> = ({
    nodes,
    selectedNodeId,
    selectNodeCallback
}) => {
    // Transform nodes to d3 hierarchy
    const root = hierarchy(transformNodeToD3Data(0, nodes));

    const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });

    // Calculate tree size
    const treeHeight = root.height * NODE_SIZE[1];
    const leaves = root.copy().count().value || 1;
    const treeWidth = leaves * NODE_SIZE[0];

    // Let d3 calculate our layout
    layout.size([treeWidth, treeHeight]);
    layout(root);

    useEffect(() => {
        // Get the elements to manipulate
        const svg = select(`.${style.svg}`);

        // Add zoom and drag behavior
        svg.call(
            zoom().on("zoom", () => {
                const { x, y, k } = event.transform as Transform;
                setTransform({ x, y, k });
            }) as any
        );
    });

    return (
        <div class="card">
            <svg
                class={style.svg}
                width="100%"
                height={`${treeHeight + 16}px`}
                style="min-height: 60vh"
                viewBox={`0 0 ${treeWidth} ${treeHeight + 16}`}
                preserveAspectRatio="xMidyMid meet"
            >
                <g
                    transform={`translate(${transform.x} ${transform.y +
                        16}) scale(${transform.k})`}
                >
                    <g class="links">
                        {root.links().map(l => (
                            <line
                                class={style.link}
                                x1={(l.source as any).x}
                                y1={(l.source as any).y + 6}
                                x2={(l.target as any).x}
                                y2={(l.target as any).y - 18}
                            />
                        ))}
                    </g>
                    <g class="nodes">
                        {root.descendants().map(n => (
                            <TableauxTreeNode
                                selectNodeCallback={selectNodeCallback}
                                node={n}
                                selected={n.data.id === selectedNodeId}
                            />
                        ))}
                    </g>
                </g>
            </svg>
        </div>
    );
};

export default TableauxTreeView;