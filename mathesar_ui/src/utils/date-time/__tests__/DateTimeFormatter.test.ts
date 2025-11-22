import DateTimeSpecification from '../DateTimeSpecification';
import DateTimeFormatter from '../DateTimeFormatter';

describe('DateTimeFormatter edge cases', () => {
  test('does not reformat BC/AD-marked dates', () => {
    const spec = new DateTimeSpecification({ type: 'date' });
    const formatter = new DateTimeFormatter(spec);

    expect(formatter.format('2001-12-31 BC')).toBe('2001-12-31 BC');
    expect(formatter.format('2001-12-31 AD')).toBe('2001-12-31 AD');
  });

  test('does not reformat leading-zero years', () => {
    const spec = new DateTimeSpecification({ type: 'date' });
    const formatter = new DateTimeFormatter(spec);

    expect(formatter.format('0200-12-31')).toBe('0200-12-31');
    expect(formatter.format('0001-12-31')).toBe('0001-12-31');
  });

  test('does not reformat >4-digit years', () => {
    const spec = new DateTimeSpecification({ type: 'date' });
    const formatter = new DateTimeFormatter(spec);

    expect(formatter.format('20010-12-31')).toBe('20010-12-31');
  });

  test('formats normal 4-digit AD years for a friendly date format', () => {
    const spec = new DateTimeSpecification({
      type: 'date',
      dateFormat: 'friendly',
    });
    const formatter = new DateTimeFormatter(spec);

    // Friendly format uses `D MMM YYYY`, e.g. `31 Dec 2001`.
    const out = formatter.format('2001-12-31');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });
});
