/**
 * Encode a string as a URL-safe base64 string.
 *
 * The resulting string won't have any characters which require URL encoding. We
 * change `+` to `-` and `/` to `_`. We remove the padding characters `=`
 * altogether because atob only needs them when inputs are concatenated.
 *
 * TODO:
 *
 * - Refactor this code to remove use of deprecated function `escape` and
 *   `unescape`.
 * - See: https://developer.mozilla.org/en-US/docs/Glossary/Base64
 * - Consider using a 3rd party library. Maybe `base64-js`, `base64url` or
 *   `utf8`.
 */
export default class Url64 {
  static encode(s: string): string {
    const base64 = btoa(unescape(encodeURIComponent(s)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  static decode(s: string): string {
    const base64 = s.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(base64)));
  }
}
