/**
 * The message of an error that the page threw and nothing caught. For a rejected
 * promise, WebKit puts the name of the error in front of the message.
 */
export function uncaughtErrorMessage(error: Error): string {
  return error.name === 'Unhandled Promise Rejection'
    ? error.message.replace(/^\w*Error: /, '')
    : error.message;
}

/**
 * Thrown when a view change, Retry or a switch of tables cancels a `records.list` whose
 * response is still being read (known bug records-request-abort-uncaught), in each browser's words.
 */
export const ABORTED_RECORDS_REQUEST =
  /AbortError: (signal is aborted|The operation was aborted|Fetch is aborted)/;
