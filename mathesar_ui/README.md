This directory contains the frontend code for Mathesar. However, part of the frontend setup is based on prerendered json which is done through django templates. We use Svelte as the frontend library, Scss for styling, and Vite for dev tooling.

## Development setup
Refer the [main README file](https://github.com/centerofci/mathesar/blob/master/README.md) on how to spin up the entire dev setup for Mathesar as containers.

### Default - Containers

Once the containers are running, the changes made in frontend code will reflect immediately through HMR. You do not need any additional dev setup.

#### IDE configuration

There is one catch when running in containers. Your IDEs will not be able to perform any intellisense or linting because there is no local `node_modules` folder.

If you're using VS Code, you can develop inside the container, by installing [Visual Studio Code Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension. Refer [VS Code docs](https://code.visualstudio.com/docs/remote/containers) for more details.

You could also bind mount the node_modules named volume to your local path. This introduces additional complexity, depends on the OS, and the requirement that the path needs to exist. Hence, it is not configured by default in Mathesar. Using normal volumes will not work, since the host directories will override the container directories.

A simpler approach would be to copy the `node_modules` folder from the container to your local, or run `npm install` locally. This will not be used for anything except for helping the IDEs provide intellisense.

If you choose the last approach, make sure that you're using the same version of node and npm in your local as it is in the container, and that `package-lock.json` file is not modified before commiting.

### Manual

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

### Adding/Removing packages

If you want to add or remove packages, or bascially run any npm action, **always do it from within the container**. Never do it from your local node setup, since it may modify the `package-lock.json` in ways we would not want it to.

You can connect to the container and open the ui folder by running:

```bash
docker exec -it mathesar_service_1 /bin/bash
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

### Components

For guidelines on component development, refer [README of components](https://github.com/centerofci/mathesar/tree/master/mathesar_ui/src/components#readme).

You can start storybook in dev mode by connecting to the container and then running `npm run storybook`:

```bash
docker exec -it mathesar_service_1 /bin/bash

root@c273da65c52d:/code/mathesar_ui$ cd mathesar_ui && npm run storybook
```

This should start storybook at port 6006.

To build storybook, run `npm run build-storybook`. The static storybook build will be present within __storybook-static__ folder.

### Developing in Windows
Hot module replacement does not work well with WSL, as mentioned in [this issue](https://github.com/microsoft/WSL/issues/4739), when the project is present within a windows filesystem.

The simplest way to get this to work, and the advised option, is to move the project to a linux filesystem. You can clone the repo within the WSL shell in a linux filesystem, which should resolve this.

If you have to work in the windows filesystem for any other purpose, you could configure vite to poll files to identify changes, as mentioned in [this issue](https://github.com/vitejs/vite/issues/1153#issuecomment-785467271) and in the [vite documentation](https://vitejs.dev/config/#server-watch). However, this is a resource intensive process and not advised.

[This issue](https://github.com/centerofci/mathesar/issues/570) keeps track of problems encountered by Mathesar developers using Windows for local development.

## Naming conventions

* File names for Components, Classes and Stylesheets should be CamelCased.
  - Valid names:
    ```bash
    App.svelte
    CancellablePromise.ts
    App.scss
    ```

* Typescript file names should be lowerCamelCased.
  - Valid names:
    ```bash
    index.ts
    utilityFunctions.ts
    ```

* All variables and constants should be lowerCamelCased.
  - Valid names:
    ```javascript
    export let randomVariable;
    let aNewVariable = 'new variable';
    const someValue = 'constant value';
    ```

* All function names should be lowerCamelCased.
  - Valid names:
    ```javascript
    function someFunction() { ... }
    let someOtherFn = () => { ... };
    const someConstFn = () => { ... };
    ```

* All directory names should be kebab-cased (hyphen-delimited).
  - Valid names:
    ```bash
    /components/text-input/
    /components/combo-boxes/multi-select/
    ```
