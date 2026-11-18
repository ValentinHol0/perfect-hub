# Brand Product Photo

Product imagery sells only if it is believable and true to the product. Reference: `${CLAUDE_PLUGIN_ROOT}/skills/brand/references/product-photo/prompt-library.md` — sets, lighting, moods, banner themes, negative constraints, prompt examples.

## 1. Honesty rule (non-negotiable)
- A generated image is **never** presented, labelled or captioned as a real photo of the client's product, team, premises or customers.
- Generated images are allowed for: mood boards, concept directions, backgrounds and scenes without the product, campaign art clearly not claiming to be the product, and placeholder visuals marked "concept — not the real product".
- When the real product must appear (marketplace cards, product pages, ads showing the item): use the client's real photos, or composite the real product photo into a generated or staged scene and keep the product pixels unaltered in shape, colour, size, labels and quantity. Say in the delivery note that the scene is generated.
- Never invent features: no extra buttons, colours, accessories, finishes or packaging that the product does not have.
- Apply platform AI-content labels where the platform requires them for realistic generated imagery `[Unverified — check current Meta, TikTok and marketplace rules]`. Misleading product images can breach consumer-protection and advertising law — verify with a lawyer when in doubt.

## 2. Brief
```
Product:        exact item, material, colour (hex if known), size in cm, finish (matte/gloss/brushed), what is printed on it
Real photos:    paths (front, 3/4, back, detail, scale reference) — ask for them first
Use:            marketplace main image | gallery | ad | site hero | social post — and the ratio
Mood:           3 words from the brand; palette (hex)
Scene:          studio | lifestyle (where, who, what time of day) | flat lay
Must avoid:     props, colours or contexts off-brand or inappropriate for the category
```

## 3. Prompt structure (generation)
Write an art-direction paragraph in this order — sentences, not keyword soup:
1. **Subject** — exactly what is shown, material, colour, state ("a matte black 250 ml glass dropper bottle with a brushed-brass collar, label facing camera").
2. **Composition** — shot type, angle, subject position, copy space ("three-quarter view, product in the left third, empty right half for a headline").
3. **Camera** — lens and depth ("85 mm, f/4, shallow depth of field" / "top-down flat lay").
4. **Lighting** — one setup from `prompt-library.md` §2.
5. **Set and surface** — base and background from §1.
6. **Palette** — 2–4 named colours with hex from the brand.
7. **Mood/texture** — one atmospheric element from §3.
8. **Constraints** — "no text, no logos, no watermark, no extra objects"; if text is required, quote it exactly, ≤ 6 words, and still prefer setting it later in HTML.
Generate with an image tool from your tool list (`generate_image`), `node "${CLAUDE_PLUGIN_ROOT}/scripts/gen-image.mjs" --out <path> --aspect <ratio> --prompt "<paragraph>"` (Claude Code with `agy`), or an image MCP. No tool → deliver the prompt pack (3 variants) + a shoot brief (§5).
Aspect: match the use — marketplace and catalogue 1:1 or 3:4; feed 4:5; stories 9:16; site hero 16:9 or 3:2.

## 4. Review at real size (gate — every image)
Open each result at 100 % and at the size it will be used (phone feed ≈ 360–430 px wide; marketplace thumbnail ≈ 200 px).
Artefact checklist:
- [ ] Product geometry: straight edges straight, symmetric items symmetric, caps/lids/handles attached correctly, correct number of parts.
- [ ] Labels and lettering: no garbled or invented text, no fake logos; real labels only from real photos.
- [ ] Materials: glass refracts, metal reflects the environment consistently, fabric folds plausibly, liquids sit level.
- [ ] Light: one coherent light direction; shadows match it; contact shadow under the product (no floating).
- [ ] Reflections: show the scene, not random objects; no duplicated product in reflections.
- [ ] Scale: product size plausible next to hands, props and furniture.
- [ ] People: hands with five fingers and natural joints; faces and skin not waxy; no real person's likeness without rights.
- [ ] Colour: product colour matches the real product (compare to the real photo side by side); palette on brand.
- [ ] Edges and background: no halos, smudges, repeated patterns, melted props; clean cut-out edges for marketplace images.
- [ ] Copy space where the layout needs it.
Fail any item → regenerate with a corrected prompt (name the fix: "label facing camera, no text on bottle") or retouch; never ship with a caveat.

## 5. Shoot brief (when real photography is the right answer)
Shot list table: `# · shot · angle · lens · light · props · background · ratio · use`. Include: main packshot (front), 3/4, back/specs, detail/texture, scale in hand, in use, packaging, contents of the box (what arrives via Nova Poshta). Note colour accuracy: grey card or colour checker in one frame; shoot RAW; deliver sRGB for web.

## 6. Marketplace notes (Ukraine)
Rozetka, Prom, Epicentr K and others publish their own image requirements (background, minimum size, text/watermark bans, number of images) — `[Unverified]`, check the marketplace's current seller help before producing. Listing text and offer → `/selling`.

## 7. Output
```
Images: <paths> (ratio, px)
Type: generated scene | real photo edit | composite (real product in generated scene) | concept only
Prompt: <final prompt per image> · tool: <generate_image | gen-image.mjs | MCP | none>
Review: artefact checklist ✓ (fixes made: …)
Disclosure: <what is generated, how it is labelled>
```
File names: lowercase, ≤ 4 words, hyphens (`serum-bottle-marble.png`).
