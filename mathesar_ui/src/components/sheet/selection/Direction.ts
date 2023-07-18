export enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
}

export function getDirection(event: KeyboardEvent): Direction | undefined {
  const { key } = event;
  const shift = event.shiftKey;
  switch (true) {
    case shift && key === 'Tab':
      return Direction.Left;
    case shift:
      return undefined;
    case key === 'ArrowUp':
      return Direction.Up;
    case key === 'ArrowDown':
      return Direction.Down;
    case key === 'ArrowLeft':
      return Direction.Left;
    case key === 'ArrowRight':
    case key === 'Tab':
      return Direction.Right;
    default:
      return undefined;
  }
}

export function getColumnOffset(direction: Direction): number {
  switch (direction) {
    case Direction.Left:
      return -1;
    case Direction.Right:
      return 1;
    default:
      return 0;
  }
}

export function getRowOffset(direction: Direction): number {
  switch (direction) {
    case Direction.Up:
      return -1;
    case Direction.Down:
      return 1;
    default:
      return 0;
  }
}
