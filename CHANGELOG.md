# Changelog

## [1.1.0](https://github.com/4site-interactive-studios/tnc-en-lightbox/compare/v1.0.0...v1.1.0) (2026-07-02)


### Features

* **close:** more-accessible close button with backing + focus-ring token ([6b11d05](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/6b11d05c0623724ca7b485dab5c48461cfd92de6))
* design refresh — eyebrow label, forest/sky presets, accessible close button ([faf790c](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/faf790cc412d8ee693aa5c3915351170612e7128))
* **eyebrow:** render optional eyebrow label above title ([f3770a9](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/f3770a9c5c81656e8c3041ac63ab8f6ff03aa11b))
* **presets:** add forest and sky theme presets ([aa9cc89](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/aa9cc890941978ad36f47f1372c577d18e7c0e91))
* **themes:** correct forest/sky to the client mockup spec ([#47](https://github.com/4site-interactive-studios/tnc-en-lightbox/issues/47)) ([9494852](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/94948524b1f662b3113b6f822e4b8cd3a9dc88dc))


### Bug Fixes

* **brand:** override focus-ring to #ffffff for WCAG 1.4.11 (green, [#50](https://github.com/4site-interactive-studios/tnc-en-lightbox/issues/50)) ([01b7cdf](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/01b7cdfec479eec98266e0ae18018ebb84cf894c))
* **close,eyebrow:** paint close above opaque image + theme eyebrow color ([83cfd17](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/83cfd175a0ae93062c836c2a8ccc15bd1c542706))
* **close,eyebrow:** paint close above opaque image + theme the eyebrow ([#49](https://github.com/4site-interactive-studios/tnc-en-lightbox/issues/49)) ([ac57afe](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/ac57afeab6d259c1091ac3f9922aff547db30548))
* **close:** draw the × with CSS pseudo-elements + hover scale ([#49](https://github.com/4site-interactive-studios/tnc-en-lightbox/issues/49)) ([9607177](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/960717738419cbd69fd1e8e7816a4e029a514a8f))
* **close:** remove the outside-close top padding band ([#49](https://github.com/4site-interactive-studios/tnc-en-lightbox/issues/49)) ([8c088a5](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/8c088a532357bb05fc61e12c590c757f1530c20a))
* **config:** default hideImageOnMobile to false (show image on mobile) ([#50](https://github.com/4site-interactive-studios/tnc-en-lightbox/issues/50)) ([a5aa05c](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/a5aa05c76d9b99f6ee81c2cf6becda1b11232cdc))
* **cta:** add a theme-agnostic hover scale to the CTA ([#49](https://github.com/4site-interactive-studios/tnc-en-lightbox/issues/49)) ([e11961f](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/e11961fd1e8cc0753175e0052672c9920bc5fc2e))
* **dark:** invert the default CTA to white bg + [#1](https://github.com/4site-interactive-studios/tnc-en-lightbox/issues/1)f1f1f text ([#50](https://github.com/4site-interactive-studios/tnc-en-lightbox/issues/50)) ([7cc8c1c](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/7cc8c1c7edf6c5595e0978b545a192bc05d40427))
* **layout:** stack image-top vertically by overriding the 50/50 grid ([#49](https://github.com/4site-interactive-studios/tnc-en-lightbox/issues/49)) ([280bbcd](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/280bbcd4c46f464ff4369e2a0add81caeff1f61e))
* **layout:** unify the campaign layout across all themes — color-only variants ([#49](https://github.com/4site-interactive-studios/tnc-en-lightbox/issues/49)) ([6f1b002](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/6f1b002bbea1fd8df864db4e0718e285a9858b78))
* **mobile:** force image above content when stacked via order ([#50](https://github.com/4site-interactive-studios/tnc-en-lightbox/issues/50)) ([ca0b5a4](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/ca0b5a44ac8a5fe00394a61fd75fd34e26977fda))
* **mobile:** give sky close a backing over the image on mobile ([#50](https://github.com/4site-interactive-studios/tnc-en-lightbox/issues/50)) ([037ac3d](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/037ac3d2eae8d2ccfecbc25e581b3e95373f5b54))
* **themes:** correct forest/sky to the client mockup spec ([fdede2b](https://github.com/4site-interactive-studios/tnc-en-lightbox/commit/fdede2b000e0a9366548f51784075d24815d2634))

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
