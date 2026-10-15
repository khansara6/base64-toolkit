# Base64 Tool

Base64 Tool is a small, dependency-free browser application for encoding text
to Base64 and decoding Base64 back to text. It is built with vanilla HTML, CSS,
and JavaScript so it can be hosted as static files without a backend or a
package installation.

## Features

- Encode text as Base64.
- Decode Base64 as text.
- Validate Base64 input before decoding.
- Run entirely in the browser with no application dependencies.
- Support Unicode text through the app's UTF-8 conversion logic.
- Copy output to the clipboard with permission-aware feedback.
- Swap input and output, clear the workspace, load an example, or download a
  plain-text result.
- Responsive two-panel layout for phones, tablets, and desktop screens.
- Provide an offline Node.js test entry point using Node's built-in test runner.
- Run in a small Docker image with Node's built-in static HTTP server.

## Requirements

For the browser application:

- A current web browser with JavaScript enabled.

For the local test command:

- Node.js 20.19.1 LTS. The exact version is recorded in `.nvmrc`.
- `make` for the `make test` convenience command.

Docker is optional. The Dockerfile uses pinned Node 20.19.1 Alpine and does not
install third-party npm packages.

## Project files

- `index.html` — accessible browser markup and application controls.
- `styles.css` — responsive visual design, states, focus styles, and reduced-motion support.
- `app.js` — browser behavior and Base64 module API.
- `tests/base64.test.js` — Node built-in tests for encoding, decoding, and validation.
- `package.json` and `package-lock.json` — the pinned, dependency-free Node test setup.
- `.nvmrc` — exact Node 20.19.1 runtime pin.
- `Makefile` — the single `make test` entry point.
- `Dockerfile` — static serving and offline test image definition.

## Local setup and run

No dependency installation is required because the project has no npm
dependencies. From the project directory, select Node 20 if you use nvm:

```sh
nvm use
```

To serve the static files locally, use any static-file HTTP server. For
example, Python's standard-library server is available on many development
machines:

```sh
python -m http.server 8080
```

On Windows, the Python launcher can be used when `python` is not the command
name:

```powershell
py -m http.server 8080
```

Open <http://localhost:8080/> in a browser. Serving over HTTP is preferred to
opening the HTML file directly because it matches a normal static deployment
and avoids browser module restrictions.

## Usage

1. Enter plain text or paste a Base64 value into **Input**.
2. Choose **Encode** to convert UTF-8 text to Base64, or **Decode** to recover
   UTF-8 text from Base64.
3. Use **Copy output** or **Download** after a result is available.
4. Use **Swap** to move the result back into the input for the next operation.
5. Use **Load example** to try Hindi, accented text, and emoji. **Clear all**
   resets both fields, counts, and feedback.

Malformed Base64 is rejected when decoding. The decoder also rejects bytes that
are not valid UTF-8 instead of replacing them silently.

The `app.js` module exposes these functions for the UI and tests:

```js
encodeBase64(text)
decodeBase64(base64)
validateBase64(base64)
```

`encodeBase64` accepts text and returns Base64. `decodeBase64` accepts a valid
Base64 string and returns text. `validateBase64` returns `{ valid, error }`,
allowing invalid input to be rejected before decoding. The browser UI displays
the returned error without inserting user-provided text as HTML.

## Testing

The project uses Node's built-in `node:test` runner and does not download
packages. Run the configured test command with either form:

```sh
make test
```

```sh
npm test --offline
```

The package script points to `tests/base64.test.js`. The tests cover ordinary
text, Hindi, emoji and accented characters, empty input, malformed syntax,
non-canonical padding, and invalid UTF-8 byte sequences.

## Docker

Build the image from the project directory:

```sh
docker build -t base64-tool .
```

Run the static app on port 8080:

```sh
docker run --rm -p 8080:8080 base64-tool
```

Then open <http://localhost:8080/>. Run the offline Node test command by
overriding the image's static-server command:

```sh
docker run --rm base64-tool npm test --offline
```

The image contains the project files and has no runtime network requirement for
the app or its tests. Because the project has no npm dependencies, the image
does not run an install step. The base image itself is retrieved by Docker
during the initial image build and should be cached for fully offline
subsequent builds.

## Deployment

The finished application is a static site. Deploy `index.html`, `styles.css`,
and `app.js` to any static hosting service:

1. Run the local test command.
2. Upload the three static application files to the host's public directory.
3. Configure the host to serve `index.html` at the site root.
4. Open the deployed HTTPS URL and verify encoding, decoding, and validation
   in a browser.

Alternatively, deploy the Docker image to a container host that maps its
configured public port to container port `8080`.

## Privacy and security

The intended application performs encoding and decoding in the browser. It has
no backend, database, analytics dependency, or required network request, so
input should remain in the page unless a user deliberately copies or submits
it elsewhere. Static hosting providers and browsers can still produce their
own access logs, cached content, or history entries; review those services'
policies before processing sensitive material.

Do not place secrets into URLs, screenshots, shared terminals, source control,
or public hosting. Clear the page after handling sensitive text and use the
browser's normal privacy controls when appropriate.

## Base64 is not encryption

Base64 is an encoding, not encryption. It changes binary data into printable
characters and is reversible by anyone who has the encoded value. It provides
no confidentiality, password protection, access control, or tamper detection.

Do not use Base64 to protect passwords, API keys, personal data, or other
secrets. Use established authenticated encryption and sound key management
for confidentiality, and use HTTPS/TLS when sending data over a network.
Base64 also increases the size of data by roughly one third and is not a
compression format.
