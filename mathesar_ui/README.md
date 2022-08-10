# Mathesar UI

This directory contains the frontend code for Mathesar. However, part of the frontend setup is based on pre-rendered json which is done through django templates. We use Svelte as the frontend library, Scss for styling, and Vite for dev tooling.

## Development setup

Refer the [main README file](../README.md) on how to spin up the entire dev setup for Mathesar as containers.

### Option 1: Setup with containers (recommended)

Once the containers are running, the changes made in frontend code will reflect immediately through HMR. You do not need any additional dev setup.

#### IDE configuration

There is one catch when running in containers. Your IDEs will not be able to perform any intellisense or linting because there is no local `node_modules` folder.

Options:

- Run `npm install` locally (or copy the `node_modules` folder from the container to your host file system). This will not be used for anything except for helping the IDEs provide intellisense.

  If you choose this approach, make sure that you're using the same version of node and npm in your local as it is in the container, and that `package-lock.json` file is not modified before committing.

- Bind mount the `node_modules` named volume to your local path. This introduces additional complexity, depends on the OS, and the requirement that the path needs to exist. Hence, it is not configured by default in Mathesar. Using normal volumes will not work, since the host directories will override the container directories.

- Use VS Code with the [Visual Studio Code Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension. Refer [VS Code docs](https://code.visualstudio.com/docs/remote/containers) for more details.

### Option 2: Manual setup

If you don't want to use Docker, you can run the front end locally.

1. `cd mathesar_ui`
1. `npm install`
1. `npm run dev`

   This will start a vite server at port 3000. The vite client and main files are referenced by our server rendered html files. Refer [backend integration in vite docs](https://vitejs.dev/guide/backend-integration.html).

Caveats

- When running manually, the `package-lock.json` file may change depending on your node/npm version or your OS. Make sure to not commit those changes. If you want to add/remove packages, follow the steps in the following section.

- The rest of the documentation within this README assumes a Docker setup. If you use a local setup instead, you'll need to interpret the remaining documentation for your specific setup.

## Developing on Windows

- Hot module replacement does not work well with WSL when the project is present within a Windows filesystem, as mentioned in [this issue](https://github.com/microsoft/WSL/issues/4739).

- The simplest way to get this to work (and the one we advise) is to move the project to a Linux filesystem. This can be achieved by cloning the repo within the WSL shell in a Linux filesystem.

- If you have to work in the Windows filesystem, you could configure Vite to poll files to identify changes, as mentioned in [this issue](https://github.com/vitejs/vite/issues/1153#issuecomment-785467271) and in the [Vite documentation](https://vitejs.dev/config/#server-watch). However, this is a resource intensive process so we advise the previous option instead.

- [This issue](https://github.com/centerofci/mathesar/issues/570) keeps track of problems encountered by Mathesar developers using Windows for local development.

## Formatting

We use [Prettier](https://prettier.io/) to automatically format code.

### Automatically when you save a file

Prettier works great when configured to automatically format files when you save them in your editor.

- VS Code

  1. In "Settings" > "Workspace", search for "format on save".
  1. Install the "Prettier" extension (`esbenp.prettier-vscode`).
  1. Set "Editor: Default Formatter" to "Prettier".
  1. Enable "Editor: Format On Save".

### Manually before you submit a PR

If you don't have your editor configured to auto-format your code, then you'll need to make sure to manually run Prettier before submitting a PR, otherwise your code might fail a test in our continuous integration pipeline which checks to ensure that all code matches the way that Prettier would format it.

- Format all front end files

  ```
  docker exec -it -w /code/mathesar_ui mathesar_service npm run format
  ```

- Format a specific file

  ```
  docker exec -it -w /code/mathesar_ui mathesar_service npx prettier --write src/App.svelte
  ```

## Linting

We use [ESLint](https://eslint.org/) to help spot more complex issues within code that cannot be fixed automatically with formatting changes. The code you write will need to be free of linting errors before it can be merged. Make sure to run the linter to check for theses errors before submitting a PR.

- Lint all front end files:

  ```
  docker exec -it -w /code/mathesar_ui mathesar_service npm run lint
  ```

- Lint a specific file:

  ```
  docker exec -it -w /code/mathesar_ui mathesar_service npx eslint src/App.svelte
  ```

## Testing

### Integration tests

See [Integration tests](../mathesar/tests/integration/README.md).

### Unit tests

We use [Jest](https://jestjs.io/) to run our unit tests, and we use [Testing Library](https://testing-library.com/docs/svelte-testing-library/intro/) to test our Svelte components.

#### Running unit tests

- Run all our tests:

  ```
  docker exec -it -w /code/mathesar_ui mathesar_service npm test
  ```

- Re-run a specific test by name:

  ```
  docker exec -it -w /code/mathesar_ui mathesar_service npx jest TextInput
  ```

  This will run all test files with file names containing `TextInput`.

#### Writing unit tests

- Let's pretend we have a file `primeUtils.ts` containing function `getPrimality` that returns `true` for prime numbers.

  We can test function with a file `primeUtils.test.ts` as follows:

  ```ts
  import { getPrimality } from './primeUtils';

  test('getPrimality', () => {
    expect(getPrimality(2)).toBe(true);
    expect(getPrimality(3)).toBe(true);
    expect(getPrimality(4)).toBe(false);
    expect(getPrimality(5)).toBe(true);
    expect(getPrimality(6)).toBe(false);
    expect(getPrimality(7)).toBe(true);

    expect(getPrimality(3484403346821219)).toBe(true);
    expect(getPrimality(4508972191266181)).toBe(false);

    expect(() => getPrimality(0)).toThrow(); // Can't check zero
    expect(() => getPrimality(-7)).toThrow(); // No negative numbers
    expect(() => getPrimality(1)).toThrow(); // Primality of 1 is historically ambiguous
    expect(() => getPrimality(5.5)).toThrow(); // No decimals
  });
  ```

- Functions like `test` and `expect` are automatically imported into scope by the test runner. Your editor should hopefully be smart enough to see that Jest is configured for our project and provide you some assistance in using those functions. You can find more in the [Jest docs](https://jestjs.io/docs/getting-started), but there's not much else you'll need if you follow the pattern above.
- After, `expect`, you'll use a [matcher](https://jestjs.io/docs/using-matchers). In the example above, we've used `toBe` which is one of the simplest matchers. However `toBe` only works for primitives like numbers, booleans, and strings. If you want to compare two objects or arrays, you'll need to use `toEqual` instead, which performs a deep comparison.
- The `expect` call is an "assertion". We can put many of them within the same test, but the test will stop running when it hits the first failure.
- We can put many tests within the same file.
- Commonly we'll have one test for each function, and many assertions within that test. You can also declare variables and do other logic within the test too if you're trying to build up complex scenarios with assertions throughout a workflow. As the scenarios get more complex, it can be helpful to create multiple tests for the same function.
- Deciding _what to test_, and _how_ can be an art! You generally want to try poking and the boundaries and edge cases. We don't have to go crazy with all sorts of assertions for every scenario. Just a few will do. We're not trying to test every possible input -- just some of the important ones.
- If you find a bug, it's great practice to write a test that fails before even beginning work on the fix.

## Adding/Removing packages

If you want to add or remove packages, or basically run any npm action, **always do it from within the container**. Never do it from your local node setup, since it may modify the `package-lock.json` in ways we would not want it to.

1. Connect to the container and open the ui folder:

   ```bash
   docker exec -it mathesar_service /bin/bash
   cd mathesar_ui
   ```

1. Add or remove packages.

   ```bash
   root@c273da65c52d:/code/mathesar_ui$ ls
   Dockerfile  jsconfig.json  package-lock.json  public  vite.config.js
   README.md   node_modules   package.json       src

   root@c273da65c52d:/code/mathesar_ui$ npm install <package>

   root@c273da65c52d:/code/mathesar_ui$ npm uninstall <package>
   ```

1. Before committing the `package-lock.json` file, run `npm install --unsafe-perm` in the container.

   ```bash
   root@c273da65c52d:/code/mathesar_ui$ npm install --unsafe-perm
   ```

   Reason:

   - We force resolutions of certain packages which have vulnerabilities, using the [`npm-force-resolutions` package](https://www.npmjs.com/package/npm-force-resolutions).
   - These resolutions are mentioned in the package.json file. They are only to be used when nested dependencies have severe vulnerabilities but our direct dependencies do not use the vulnerability free versions. Extra care should be taken here to make sure the direct dependencies do not break.
   - This needs to run during the `preinstall` lifecycle.
   - After every package action (add/remove), the `npm install` command needs to be run additionally to enforce these resolutions.
   - Since our node instance runs as root in the container, the [`--unsafe-perm` flag](https://docs.npmjs.com/cli/v6/using-npm/config#unsafe-perm) needs to be specified.

## Components

- The `src/component-library` directory contains general-purpose components which will eventually be spun off into its own package, separate from Mathesar.
- See the [Components README](./src/component-library/README.md) for more details.

### Storybook

We use [Storybook](https://storybook.js.org/) to develop and document our components.

- **Start** Storybook in dev mode with:

  ```bash
  docker exec -it -w /code/mathesar_ui mathesar_service npm run storybook
  ```

- **Build** Storybook with:

  ```bash
  docker exec -it -w /code/mathesar_ui mathesar_service npm run build-storybook
  ```

## Coding standards

See https://wiki.mathesar.org/en/engineering/standards/frontend
