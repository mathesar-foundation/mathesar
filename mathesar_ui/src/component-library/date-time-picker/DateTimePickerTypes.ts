export interface InlineDateTimePickerProps {
  type: 'date' | 'time' | 'datetime';
  format: string;
  value?: string | null;
  timeShow24Hr?: boolean;
  timeEnableSeconds?: boolean;
}
