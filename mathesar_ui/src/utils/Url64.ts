/**
 * Encode a string as a URL-safe base64 string.
 *
 * The resulting string won't have any characters which require URL encoding. We
 * change `+` to `-` and `/` to `_`. We remove the padding characters `=`
 * altogether because atob only needs them when inputs are concatenated.
 */
export default class Url64 {
  static encode(s: string): string {
    const bytes = new TextEncoder().encode(s);
    const binString = Array.from(bytes, (byte) =>
      String.fromCharCode(byte),
    ).join('');
    const base64 = btoa(binString);

    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  static decode(s: string): string {
    const base64 = s.replace(/-/g, '+').replace(/_/g, '/');

    const binString = atob(base64);
    const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
}
