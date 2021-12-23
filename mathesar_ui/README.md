# Mathesar UI

This directory contains the frontend code for Mathesar. However, part of the frontend setup is based on pre-rendered json which is done through django templates. We use Svelte as the frontend library, Scss for styling, and Vite for dev tooling.

## Development setup

Refer the [main README file](../README.md) on how to spin up the entire dev setup for Mathesar as containers.

### Option 1: Setup with containers (recommended)

Once the containers are running, the changes made in frontend code will reflect immediately through HMR. You do not need any additional dev setup.

#### IDE configuration

There is one catch when running in containers. Your IDEs will not be able to perform any intellisense or linting because there is no local `node_modules` folder.

If you're using VS Code, you can develop inside the container, by installing [Visual Studio Code Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension. Refer [VS Code docs](https://code.visualstudio.com/docs/remote/containers) for more details.

You could also bind mount the node_modules named volume to your local path. This introduces additional complexity, depends on the OS, and the requirement that the path needs to exist. Hence, it is not configured by default in Mathesar. Using normal volumes will not work, since the host directories will override the container directories.

A simpler approach would be to copy the `node_modules` folder from the container to your local, or run `npm install` locally. This will not be used for anything except for helping the IDEs provide intellisense.

If you choose the last approach, make sure that you're using the same version of node and npm in your local as it is in the container, and that `package-lock.json` file is not modified before committing.

### Option 2: Manual setup

You could however prefer to run the frontend locally, which is straight forward:

```bash
cd mathesar_ui
npm install
npm run dev
```

This will start a vite js server at port 3000. The vite client and main files are referenced by our server rendered html files. Refer [backend integration in vite docs](https://vitejs.dev/guide/backend-integration.html).

For testing:

```bash
npm run test
```

For building the files:

```bash
npm run build
```

When running manually, the `package-lock.json` file may change depending on your node/npm version or your OS. Make sure to not commit those changes. If you want to add/remove packages, follow the steps in the following section.

## Developing on Windows

Hot module replacement does not work well with WSL when the project is present within a Windows filesystem, as mentioned in [this issue](https://github.com/microsoft/WSL/issues/4739).

The simplest way to get this to work (and the one we advise) is to move the project to a Linux filesystem. This can be achieved by cloning the repo within the WSL shell in a Linux filesystem.

If you have to work in the Windows filesystem, you could configure Vite to poll files to identify changes, as mentioned in [this issue](https://github.com/vitejs/vite/issues/1153#issuecomment-785467271) and in the [Vite documentation](https://vitejs.dev/config/#server-watch). However, this is a resource intensive process so we advise the previous option instead.

[This issue](https://github.com/centerofci/mathesar/issues/570) keeps track of problems encountered by Mathesar developers using Windows for local development.

## Adding/Removing packages

If you want to add or remove packages, or basically run any npm action, **always do it from within the container**. Never do it from your local node setup, since it may modify the `package-lock.json` in ways we would not want it to.

You can connect to the container and open the ui folder by running:

```bash
docker exec -it mathesar_service /bin/bash
cd mathesar_ui
```

and then perform any action from within it. Example:

```bash
root@c273da65c52d:/code/mathesar_ui$ ls
Dockerfile  jsconfig.json  package-lock.json  public  vite.config.js
README.md   node_modules   package.json       src

root@c273da65c52d:/code/mathesar_ui$ npm install <package>

root@c273da65c52d:/code/mathesar_ui$ npm uninstall <package>
```

## Components

- The `src/component-library` directory contains general-purpose components which will eventually be spun off into its own package, separate from Mathesar.
- See the [Components README](./src/component-library/README.md) for more details.

### Storybook 

We use [Storybook](https://storybook.js.org/) to develop and document our components.

- __Start__ Storybook in dev mode with:

    ```bash
    docker exec -it -w /code/mathesar_ui mathesar_service npm run storybook
    ```

- __Build__ Storybook with:

    ```bash
    docker exec -it -w /code/mathesar_ui mathesar_service npm run build-storybook
    ```

## Naming conventions

* File names for Components, Classes and Stylesheets should be in PascalCase. Examples:
    
    ```txt
    App.svelte
    CancellablePromise.ts
    App.scss
    ```

* Typescript file names should be in lowerCamelCase. Examples:
    
    ```txt
    index.ts
    utilityFunctions.ts
    ```

* All variables and constants should be in lowerCamelCase. Examples:
    
    ```javascript
    export let randomVariable;
    let aNewVariable = 'new variable';
    const someValue = 'constant value';
    ```

* All function names should be in lowerCamelCase. Examples:
    
    ```javascript
    function someFunction() { /* ... */ }
    let someOtherFn = () => { /* ... */ };
    const someConstFn = () => { /* ... */ };
    ```

* All directory names should be in kebab-case (hyphen-delimited). Examples:
    
    ```txt
    /components/text-input/
    /components/combo-boxes/multi-select/
    ```

* Acronyms within PascalCase and camelCase should be treated as words. Examples:

    ```txt
    UrlInput.svelte
    ```

    ```ts
    function getApiUrl() { /* ... */ }
    let currentDbName;
    ```

    - [discussion](https://github.com/centerofci/mathesar/discussions/908)
    - Not all code conforms to this standard yet, and bringing existing code into conformance is a low priority.

* Use American English spelling instead of British English spelling. Examples:

    ```txt
    LabeledInput.svelte
    ColorSelector.svelte
    ```

    - [discussion](https://github.com/centerofci/mathesar/discussions/891)

* If a TypeScript file contains _only_ type definitions (without any values or implementation), then use the file extension `.d.ts` instead of `.ts`. If you use `enum` or `const` you'll need make the file a `.ts` file. If you only use `type` and `interface`, then make the file a `.d.ts` file.

* Prefer the term "delete" in code and UI over similar terms like "remove" and "drop".

    - [discussion](https://github.com/centerofci/mathesar/discussions/872)

