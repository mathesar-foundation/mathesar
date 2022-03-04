/**
 * Encode a string as a URL-safe base64 string.
 *
 * The resulting string won't have any characters which require URL encoding.
 * We change `+` to `-` and `/` to `_`. We remove the padding characters `=`
 * altogether because atob only needs them when inputs are concatenated.
 */
export default class Url64 {
  static encode(s: string): string {
    const base64 = btoa(s);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  static decode(s: string): string {
    return atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  }
}
