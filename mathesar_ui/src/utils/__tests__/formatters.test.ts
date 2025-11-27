import { describe, expect, it } from 'vitest';

import DateTimeFormatter from '../date-time/DateTimeFormatter';
import DateTimeSpecification from '../date-time/DateTimeSpecification';
import { EmailFormatter } from '../email/EmailFormatter';
import { UriFormatter } from '../uri/UriFormatter';

describe('formatters should map empty input to null', () => {
  it('EmailFormatter.parse("") returns value null', () => {
    const f = new EmailFormatter();
    const { value } = f.parse('');
    expect(value).toBeNull();
  });

  it('UriFormatter.parse("") returns value null', () => {
    const f = new UriFormatter();
    const { value } = f.parse('');
    expect(value).toBeNull();
  });

  it('DateTimeFormatter.parse("") returns value null for date type', () => {
    const spec = new DateTimeSpecification({ type: 'date' });
    const f = new DateTimeFormatter(spec);
    const { value } = f.parse('');
    expect(value).toBeNull();
  });

  it('DateTimeFormatter.parse("") returns value null for time type', () => {
    const spec = new DateTimeSpecification({ type: 'time' });
    const f = new DateTimeFormatter(spec);
    const { value } = f.parse('');
    expect(value).toBeNull();
  });

  it('DateTimeFormatter.parse("") returns value null for datetime type', () => {
    const spec = new DateTimeSpecification({ type: 'timestamp' });
    const f = new DateTimeFormatter(spec);
    const { value } = f.parse('');
    expect(value).toBeNull();
  });
});
