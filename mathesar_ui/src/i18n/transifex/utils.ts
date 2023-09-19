import * as readline from 'readline';

export async function promptTransifexToken(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise<string>((resolve) => {
    rl.question(
      "API token not found. Please provide it. If you don't have an API token, you can generate one in https://app.transifex.com/user/settings/api/\n",
      resolve,
    );
  }).finally(() => {
    rl.close();
  });
}

export const logger = console;
