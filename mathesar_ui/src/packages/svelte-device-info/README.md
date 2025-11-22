# Svelte Device Info

A utility that allows an app to easily determine information about the device on which it's running.

## Usage

1. Put this somewhere high up in your app:

    ```ts
    onMount(observeDeviceInfo);
    ```

1. Import and read `deviceInfo` throughout your app:

    ```ts
    $: ({ hasMouse } = $deviceInfo);
    ```
