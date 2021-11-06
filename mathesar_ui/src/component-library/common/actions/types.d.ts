export interface Action {
  update?: (arg: unknown) => void;
  destroy: () => void;
}
