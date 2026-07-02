# README screenshot capture

This package regenerates the product screenshots used in the root `README.md`.

## Preconditions

Start the local development app from the repository root:

```sh
docker compose -f docker-compose.dev.yml up dev-service
```

The app should be reachable at `http://localhost:8000` and accept the default
development credentials:

- username: `admin`
- password: `password`

## Regenerate screenshots

```sh
npm --prefix assets/readme ci
npm --prefix assets/readme run capture -- --base-url http://localhost:8000 --reset
```

The `--reset` flag recreates only the dedicated `readme_showcase` database and
then captures the 13 screenshots declared in `manifest.json`.

## Validate existing screenshots

```sh
npm --prefix assets/readme run validate
```

The validation pass confirms that every manifest entry has a readable PNG file
in `assets/readme/screenshots/`.
