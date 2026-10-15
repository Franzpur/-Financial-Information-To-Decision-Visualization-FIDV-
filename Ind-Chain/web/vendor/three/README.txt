three.js 0.170.0 — vendored for offline use (SFC local app, P2)
Retrieved: 2026-10-14
Source (npm):      https://registry.npmjs.org/three/-/three-0.170.0.tgz
Cross-check (CDN): https://cdn.jsdelivr.net/npm/three@0.170.0/ (build/three.module.js and examples/jsm/controls/OrbitControls.js byte-identical to the npm package)
tgz sha1:       6087f97aab79e9e9312f9c89fcef6808642dfbb7 (equals npm dist.shasum)
tgz sha256:     4a608a355dcaba72e0e5383cdc814303f5b6060b43c238cdf6932dceb699238d
tgz integrity:  sha512-FQK+LEpYc0fBD+J8g6oSEyyNzjp+Q7Ks1C568WWaoMRLW+TkNNWmenWeGgJjV105Gd+p/2ql1ZcjYvNiPZBhuQ== (equals npm dist.integrity)
Import closure: three.module.js has no imports; OrbitControls.js imports only 'three'.
Used by: web/js/scene.js via the importmap in web/cube.html ("three", "three/addons/").
Verify: awk '/^BEGIN SHA256$/{f=1;next}/^END SHA256$/{f=0}f' README.txt | shasum -a 256 -c -   (run inside this directory)

BEGIN SHA256
ce1fa418de16a19495a9f72495580e3015d7745c296d3ce0485897f902ddedfb  build/three.module.js
80efaadea4f8a636a65fb0bd08bfef62f3d93a0bb94e2e7500f23176c5c07f4e  examples/jsm/controls/OrbitControls.js
4c40a1ef62450b857c3b2aaf294936304cd552d965fbcd9d32d4c5bcf4ba4454  LICENSE
END SHA256

License (MIT) — see LICENSE; full text:

The MIT License

Copyright © 2010-2024 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
