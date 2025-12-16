import { ImmutableSet } from '@mathesar-component-library';

import { makeCellId } from '../../cellIds';
import { Direction } from '../Direction';
import Plane from '../Plane';
import Series from '../Series';
import SheetSelection from '../SheetSelection';

const r1 = 'r1'; const r2 = 'r2'; const
r3 = 'r3';
const c1 = 'c1'; const c2 = 'c2'; const
c3 = 'c3';

function create3x3Plane() {
    return new Plane(
        new Series([r1, r2, r3]),
        new Series([c1, c2, c3]),
        undefined,
        new ImmutableSet()
    );
}

test('SheetSelection.resized from top-left', () => {
    const p = create3x3Plane();
    const c1r1 = makeCellId(r1, c1);

    // Start with A1 selected
    let s = new SheetSelection(p).ofOneCell(c1r1);

    // Shift+Right -> Expand to A1:B1
    s = s.resized(Direction.Right);
    expect([...s.columnIds]).toEqual([c1, c2]);
    expect([...s.rowIds]).toEqual([r1]);
    expect(s.activeCellId).toBe(c1r1);

    // Shift+Down -> Expand to A1:B2
    s = s.resized(Direction.Down);
    expect([...s.columnIds]).toEqual([c1, c2]);
    expect([...s.rowIds]).toEqual([r1, r2]);
    expect(s.activeCellId).toBe(c1r1);

    // Shift+Left -> Shrink to A1:A2
    s = s.resized(Direction.Left);
    expect([...s.columnIds]).toEqual([c1]);
    expect([...s.rowIds]).toEqual([r1, r2]);
    expect(s.activeCellId).toBe(c1r1);
});

test('SheetSelection.resized from bottom-right', () => {
    const p = create3x3Plane();
    const c3r3 = makeCellId(r3, c3);

    // Start with C3 selected
    let s = new SheetSelection(p).ofOneCell(c3r3);

    // Shift+Left -> Expand to B3:C3
    s = s.resized(Direction.Left);
    expect([...s.columnIds]).toEqual([c2, c3]);
    expect([...s.rowIds]).toEqual([r3]);
    expect(s.activeCellId).toBe(c3r3);

    // Shift+Up -> Expand to B2:C3
    s = s.resized(Direction.Up);
    expect([...s.columnIds]).toEqual([c2, c3]);
    expect([...s.rowIds]).toEqual([r2, r3]);
    expect(s.activeCellId).toBe(c3r3);
});

test('SheetSelection.resized crossing active cell', () => {
    const p = create3x3Plane();
    const c2r2 = makeCellId(r2, c2); // Middle cell

    let s = new SheetSelection(p).ofOneCell(c2r2);

    // Shift+Right -> B2:C2
    s = s.resized(Direction.Right);
    expect([...s.columnIds]).toEqual([c2, c3]);
    expect([...s.rowIds]).toEqual([r2]);

    // Shift+Left -> Back to B2
    s = s.resized(Direction.Left);
    expect([...s.columnIds]).toEqual([c2]);
    expect([...s.rowIds]).toEqual([r2]);

    // Shift+Left again -> A2:B2
    s = s.resized(Direction.Left);
    expect([...s.columnIds]).toEqual([c1, c2]);
    expect([...s.rowIds]).toEqual([r2]);
});

test('SheetSelection.resized at edges', () => {
    const p = create3x3Plane();
    const c1r1 = makeCellId(r1, c1);

    const s = new SheetSelection(p).ofOneCell(c1r1);

    // Shift+Up from Top-Left -> Should stay same
    const s2 = s.resized(Direction.Up);
    expect(s2).toBe(s); // Should return same instance if no change? Or equal?
    // Implementation returns `this` if newAnchorDiff is none.

    // Shift+Left from Top-Left
    const s3 = s.resized(Direction.Left);
    expect(s3).toBe(s);
});
