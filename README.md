# Chemistry Interactive Learning Website

An interactive Grade 9 chemistry exhibition built around inspectable 3D models and short guided lessons. It runs entirely in the browser, needs no account, and stores learning progress and display preferences on the current device.

**[Open the live chemistry site](https://tiennguyenminh212012-lang.github.io/hoahoc/)**

## Explore

- **Study:** Atom Explorer, a searchable 118-element periodic table, ionic and covalent bonding, a supported-compound builder, polyatomic-ion study and recall, and reaction families with interactive equation balancing.
- **Free Area:** Drag or tap protons and neutrons into a nucleus, add electrons to individual shells, or auto-fill a neutral shell model for elements 1–20. The element identity and isotope mass number update as you build. Save neutral atoms and combine them on a compound or reactant tray; the checker names only verified lesson examples.
- **3D Models:** Atomic, molecular, bonding, ion, and reaction exhibits. Every detailed atomic exhibit (Hydrogen-1, Sodium-23, and Chlorine-35) has **Probability cloud**, **Basic electron shells**, and **Nucleus** controls. Shell rings are a simple energy-level teaching model, not literal electron paths.
- **Reactions:** The five balanced examples show conserved atom tokens moving through a change zone. Bonds visibly break and form for molecular reactions; zinc and copper show a labeled two-electron transfer; silver chloride formation shows ion regrouping without electron transfer. A text guide explains each schematic, including in the 2D fallback.
- **Inspect and navigate:** Select scene objects for explanations; rotate and zoom with mouse, touch, or labeled buttons. Lesson links preserve relevant selections in the URL.
- **Remember:** Recent elements, lesson steps, ion practice, motion, and graphics preferences persist in `localStorage`.

The 3D objects are educational diagrams. Particle sizes, distances, electron-density markers, and reaction timing are not to scale.

## Tech stack

Vite 8, React 19, TypeScript, React Router with hash routes, Three.js with React Three Fiber and Drei, Zustand, Vitest, React Testing Library, and locally packaged Inter, Space Grotesk, and JetBrains Mono fonts. There is no backend, account system, or database.

## Run locally

Install Node.js 24 and pnpm 11.25.0, then run:

```bash
pnpm install --frozen-lockfile
pnpm run dev
```

Open the local address shown by Vite. Other useful commands:

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run test:watch
pnpm run build
pnpm run preview
```

`build` creates `dist/`. To check the repository-subpath build locally, set `GITHUB_REPOSITORY=owner/repository` in your shell and run `pnpm run build:pages`.

## Project layout

| Directory | Purpose |
| --- | --- |
| `src/app` | Routes, loading and error boundaries, persisted progress |
| `src/pages` | Welcome, lessons, periodic table, gallery, and model viewer |
| `src/scenes` | Shared WebGL viewport and 3D atom, molecule, bonding, and reaction scenes |
| `src/chemistry-data` | Elements, detailed isotopes, ions, supported compounds, reactions |
| `src/chemistry` | Formula parsing, balancing, electron and validation helpers |
| `src/components` | Header, formula markup, and inspector |
| `src/tests` | Chemistry and navigation tests |
| `.github/workflows/deploy.yml` | Build, test, and Pages deployment |

## GitHub Pages

The workflow deploys on pushes to `main`. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the build and deployment source. Push to `main`, then inspect the **Actions** tab for the deployment result. A project repository is served at `https://OWNER.github.io/REPOSITORY/`.

`vite.config.ts` derives the production base path from GitHub's `GITHUB_REPOSITORY` environment variable, so the repository name does not need to be hard-coded. Hash routes keep direct lesson links working from a project subpath. The workflow checks types, lint, and tests before building and deploying `dist/`.

## Graphics and accessibility

**Graphics** offers Auto, High, and Low. Auto reduces scene detail on narrow or high-density screens and less capable devices. Reduced motion lowers optional movement while keeping lesson changes available. Scenes pause rendering when the page is hidden, and a labeled fallback appears when WebGL is unavailable.

The interface uses semantic links, buttons, formulas with real subscript/superscript markup, visible keyboard focus, a skip link, labeled scene controls, and text alongside color-coded particles. Many 3D actions also have on-screen controls, so gestures are optional. Responsive layouts cover desktop, tablet, and phone widths.

## Chemistry data and extending the site

Element records live in `src/chemistry-data/elements.ts`; detailed neutral-atom examples live in `isotopes.ts`. The complete table includes 118 elements, while three isotopes have the detailed interactive atom scenes. To add an atom exhibit, add a checked isotope with its shell arrangement and configuration, then add its entry in `src/pages/ModelGallery/models.ts`. The scenes consume this structured data; they should not embed chemistry facts.

The compound builder's accepted examples live in `src/chemistry-data/compounds.ts`. Add a formula, participating elements, bond type, and teaching explanation there; then add scene support if it requires a new geometry. Unsupported combinations are explained to learners instead of being treated as valid.

For a reaction, add a balanced record in `src/chemistry-data/reactions.ts`, including its family, reactants, products, coefficients, and explanation. Formula parsing and atom conservation checks live in `src/chemistry`. Add a matching test in `src/tests/chemistry.test.ts` when extending the dataset.

## Limits

- Detailed atom scenes cover Hydrogen-1, Sodium-23, and Chlorine-35. Other table entries provide element information without implying a verified isotope or 3D configuration.
- The compound and Free Area trays intentionally accept selected verified examples; they are not general chemistry simulators. Free Area's shell guide covers neutral atoms 1–20, while element identification covers 1–118. It does not check isotope stability.
- Reaction scenes simplify microscopic events. Blue dots in covalent examples represent changing shared electron density, while the two dots in zinc displacement represent electron transfer. The silver chloride example does not show electron transfer. The balancing counters, rather than the animation, determine whether an equation conserves atoms.
- Progress remains in one browser's local storage and is not synchronized between devices.

## Chemistry references

Instructional wording and data were checked against [OpenStax Chemistry 2e](https://openstax.org/details/books/chemistry-2e), especially its [quantum theory](https://openstax.org/books/chemistry-2e/pages/6-3-development-of-quantum-theory), [ionic and molecular compounds](https://openstax.org/books/chemistry-2e/pages/2-6-ionic-and-molecular-compounds), and [chemical reactions](https://openstax.org/books/chemistry-2e/pages/4-2-classifying-chemical-reactions) chapters. The app links to relevant reading from the lesson inspectors.
