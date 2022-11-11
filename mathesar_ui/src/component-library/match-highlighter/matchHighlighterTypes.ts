export interface MatchPart {
  text: string;
  isMatch: boolean;
}

export type ValueComparisonOutcome =
  | 'exactMatch'
  | 'substringMatch'
  | 'noMatch';
