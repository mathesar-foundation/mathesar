import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';

export interface Tab {
  label: string
  href?: string
  disabled?: boolean
  icon?: IconDefinition
  [key: string]: unknown
}
