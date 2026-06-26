# Changelog

## 1.0.0 (2026-06-26)


### Features

* **a11y:** accessible-name fallback, background inert, scroll-lock, initial dialog focus ([97449f0](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/97449f07e842b1adc70c66fce33d68ea23f83d05))
* add MIT license and set package.json version to 1.0.0 ([47b6866](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/47b6866e13c97a339ad9789d0a0d5600a21af7ee))
* add release-please automation and CI workflow ([a093404](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/a093404857e5ddeb4499ba3a9ffbc59af556f93b))
* add Vite version banner to dist/en-lightbox.js ([9b89be3](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/9b89be367ae684bd3cd640e750f60a9361e5f4f6))
* **api:** setTheme runtime re-apply, e2e theme tests, contract re-baseline ([15b8007](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/15b8007cc62c7e67b9299d39f53742ab6a6a478e))
* **ci:** cross-browser Playwright smoke matrix ([d9205b3](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/d9205b37f0a734ff846f8a50dd6c40c6173876fe))
* **ci:** cross-browser smoke matrix and dedicated job ([4ff1d26](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/4ff1d2670c16dad1f377c91d32b8c2f4b35f7d7f))
* **config:** extensible base interfaces for triggers/theme/layout/en with compile-proof augmentation fixture ([efde64b](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/efde64b7ecd404e3cab894660e1973d8733dc36c))
* **core,styles:** layout tokens, responsive classes, CTA button, secondary/decline CTA ([33397e3](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/33397e3684624bccb16ed95746e67e6a200c5132))
* **core:** image-absent layout renders single-column ([b2a3407](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/b2a34070d0495c42337276935b208dbf46c036b9))
* harden auto-init, open() and config normalization ([47e42c6](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/47e42c61f6fd93686b38dc594b607234a73b46f4))
* harden auto-init, open() and config normalization (wave-4/stream-a) ([d6feee6](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/d6feee6adb2a3b5f5be87e67fce971168a7d1489))
* implement single-source CTA action routing ([d2b573e](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/d2b573eee1bb87128fe848326240660534dcdb30)), closes [#23](https://github.com/4site-interactive-studios/tnc-en-lightbox/issues/23)
* **lightbox:** core open/close lifecycle, a11y, and config normalizer ([6411ab5](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/6411ab502465ef764f6fa1bc7155e332ec523e81))
* render lightbox in Shadow DOM for style isolation + layout polish ([6401013](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/64010132d12916bc9d11afa682aa200f59775d80))
* render lightbox in Shadow DOM for style isolation + layout polish ([589a704](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/589a70475d102f37566ba2b6eaf950959be02bd0))
* scope focus ring and flush image-top with outside-close ([a75ca64](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/a75ca6464aaf88abe013550ee357e72994906461))
* stand up wave-0 build pipeline and core lightbox ([ec9e664](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/ec9e664cd28ce21dd3b511bcce9867458d4e1943))
* **themes:** preset dark/brand/light theme classes, normalizeTheme, SCSS presets ([7a0a36e](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/7a0a36e17453133f39093f66e18caebc199d1a0a))
* **themes:** wave-2/stream-b theme set + full UI customization ([49e536a](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/49e536ae87ce6b533bc6bd7e74502c99e6b46c18))
* **triggers:** add behavior triggers, frequency-capped dismissal, and composition ([764aaef](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/764aaef22fe6eea2b33fc3b5ea78d98bd6c14faf))
* **triggers:** implement dispatcher, 4 triggers, frequency-capped dismissal ([57bb687](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/57bb687dfbc9dee7764b1b17f7e96bab3d0bf16c))
* **wave-0:** config seam, foundation contracts \u0026 a11y hardening ([947d4da](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/947d4dafbea3467035dc887e65a1cf3b586ac393))
* **wave-2:** layout, token surface, CTA button, and a11y/motion hardening ([4161411](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/4161411a6df775606ff18f5039bff3f2e1dc85ad))
* **wave-3:** EN CTA semantics, no-form-interference & editor docs ([7cb57e7](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/7cb57e79400a36162c76203de7dc90e2f611c4f0))
* **wave-4:** release & packaging — MIT license, versioning, release-please, CI hardening ([40feb3c](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/40feb3c38a952266c4f80114d27fd76afaa40c85))


### Bug Fixes

* attach dist to GitHub Release asset, pin first release to v1.0.0, harden ci.yml permissions ([6f55c05](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/6f55c05cc8dc387944d85e6f08814163141c80a7))
* drop unknown/invalid trigger specs at the root; defense-in-depth in dispatcher ([60d935c](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/60d935c64a11fd9ffcce889dacfb2cc67de67bbc))
* **layout:** imagePosition right via DOM order; drop row-reverse; add e2e x-position test ([d1c5958](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/d1c59588315d902261ce0de6458b0b11fbb8aef4))
* **lint:** add Node.js globals for tools/sdd/*.mjs scripts ([ae6a824](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/ae6a824cae1df1a2e14760e8d8ec44f32b5be5a6))
* outside close button clipping + empty-header accessible name ([ccef780](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/ccef780b3ab323171fecab767d4ac297e26c6a14))
* scope focus ring and flush image-top with outside-close ([17f6d8b](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/17f6d8b8c81002854ebe613884858da14af40b20))
* **triggers:** bail on sync fire + fail OPEN on corrupt localStorage value ([62a88b0](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/62a88b09e89db30306693dbe1fc2de04a443ca5e))
* use high-contrast token for close-button focus ring ([443b1f3](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/443b1f33707dd1cc58d2f32475365568cdb8ecad))
* **wave-2:** redirect CTA is anchor, correct reduced-motion, imagePosition render, scoped layout config, schema capture ([9a12257](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/9a12257a8748968e97b6f8a6ea1c400f5ae80deb))
