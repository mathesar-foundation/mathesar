export enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
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
