import { Clause, FOLiteral } from "../../types/clause";
import { ArrayLayout, LayoutItem } from "../../types/layout";
import { maxBy } from "../max-by";
import { estimateSVGTextWidth } from "../text-width";
import { clauseToString } from "../clause";

const HEIGHT_PADDING = 16;
const WIDTH_PADDING = 64;

export const gridLayout = (
    clauses: Array<Clause<string | FOLiteral>>,
): ArrayLayout<Clause<string | FOLiteral>> & {
    rows: number;
    columns: number;
    rowHeight: number;
    columnWidth: number;
} => {
    if (clauses.length === 0)
        return {
            width: 0,
            height: 0,
            data: [],
            rows: 0,
            columns: 0,
            rowHeight: 0,
            columnWidth: 0,
        };

    // Guess clause width by the length of the longest string
    const width =
        maxBy(clauses, (c) => estimateSVGTextWidth(clauseToString(c))) +
        WIDTH_PADDING;

    // The height is constant. The value here has no special meaning
    let height = 35 + HEIGHT_PADDING;

    const columns = findOptimalColumnNumber(width, height, clauses.length);
    console.log(columns);
    let rows = 0;

    const data: LayoutItem<Clause<string | FOLiteral>>[] = [];

    for (let i = 0; i < clauses.length; i++) {
        if (i % columns === 0) {
            rows++;
        }

        data.push({
            x: (i % columns) * width + width / 2,
            y: (rows - 1) * height + height / 2 + HEIGHT_PADDING / 2,
            data: clauses[i],
        });
    }

    return {
        height: rows * height,
        width: columns * width,
        data,
        rows,
        columns,
        rowHeight: height,
        columnWidth: width,
    };
};

const findOptimalColumnNumber = (
    cWidth: number,
    cHeight: number,
    length: number,
) => {
    const windowRatio = window.innerWidth / window.innerHeight;
    let best = 1;
    let bestValue = Infinity;
    for (let i = 1; i <= length; i++) {
        const ratio = getRatio(cWidth, cHeight, i, length);
        const diff = Math.abs(windowRatio - ratio);
        if (diff < bestValue) {
            best = i;
            bestValue = diff;
        }
    }
    return best;
};

const getRatio = (
    cWidth: number,
    cHeight: number,
    columns: number,
    length: number,
) => {
    const width = cWidth * columns;
    const height = Math.ceil(length / columns) * cHeight;

    return width / height;
};
