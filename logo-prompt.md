# Logo prompt for cheapseat.lol

Paste one of these into ChatGPT image generation. Prompt A is the primary.

## Before you generate

The site's whole visual argument is restraint. The palette is exactly four
colors and nothing else ever gets one:

| Token     | Hex       | Used for                        |
| --------- | --------- | ------------------------------- |
| ground    | `#F3F4F1` | cool limestone background       |
| ink       | `#15171A` | text and the mark               |
| gain      | `#0B7A4B` | money and upward movement only  |
| drop      | `#B23A2F` | a position dropping only        |

So the mark has to survive at 16px in a browser tab, work in flat ink on a pale
ground, and stay completely straight faced. Gold, gradients, 3D bevels, and
crowns all fight the design: section 10 of the spec bans crown imagery outright,
and gold would be a fifth color. The joke is carried by the copy, never by the
logo.

## Prompt A, the seat as a rank bar (primary)

```
A minimal flat vector logo mark for a financial leaderboard product.

Subject: a simple side-profile chair silhouette formed out of three vertical
bars of increasing height, like a bar chart that resolves into the shape of a
seat. The tallest bar reads as the chair back, the middle bars as the seat and
leg. Geometric and constructed, not illustrative.

Style: institutional and numerate, in the register of a stock exchange mark or
a bank logotype from the 1970s. Flat solid fill, single color, no gradient, no
bevel, no shadow, no 3D, no perspective, no texture, no outline strokes of
varying weight.

Color: solid near-black #15171A on a flat #F3F4F1 background. Exactly two
colors total.

Composition: centered, square canvas, generous even margins, no text, no
lettering, no wordmark, no border, no frame.

Constraints: must stay legible and unambiguous when scaled down to 16x16
pixels. No crown, no throne, no royalty imagery, no arrows, no emoji, no
mascot, no gloss.
```

## Prompt B, the empty seat

```
A minimal flat vector logo mark: an aerial or head-on view of a single theater
or stadium seat, reduced to the fewest possible geometric shapes. A rounded
rectangle for the seat with two smaller shapes suggesting armrests, and a
negative-space gap where a person would sit, so the seat reads as vacant.

Style: flat, geometric, institutional, completely deadpan. Solid single-color
fill. No gradient, no 3D, no shadow, no texture, no outline.

Color: solid #15171A on a flat #F3F4F1 background. Exactly two colors.

Composition: centered on a square canvas, even margins, no text, no lettering,
no border.

Constraints: legible at 16x16 pixels. No crown, no royalty, no people, no
emoji, no gloss.
```

## Prompt C, the number-one seat

```
A minimal flat vector logo mark combining the numeral 1 with a seat. The
numeral 1 is set as a heavy geometric slab, and its base flares horizontally
into a plinth that reads simultaneously as the foot of the numeral and as the
seat of a chair.

Style: flat, monolinear, institutional, in the register of a financial
exchange mark. Single solid color, no gradient, no 3D, no shadow, no texture.

Color: solid #15171A on flat #F3F4F1. Exactly two colors.

Composition: centered, square canvas, even margins, no additional text.

Constraints: unmistakable at 16x16 pixels. No crown, no throne, no royalty, no
emoji, no gloss.
```

## After you pick one

Ask for these follow-ups in the same chat, since consistency matters more than
any single render:

1. "Same mark, pure black on transparent, SVG-ready, no background."
2. "Same mark in #0B7A4B on #F3F4F1." (the accent variant)
3. "Same mark simplified further for a 16x16 favicon, thicker strokes, fewer
   details."

Then send me the files and I will wire them in as the favicon, the masthead
mark, and the apple-touch icon, and swap the OG image header to match.

## A note on the gold crown image

The one you sent is a strong illustration, but it works against this specific
build in three ways: crowns are explicitly ruled out in section 10, gold is a
fifth color in a palette that is deliberately four, and the 3D gloss reads as
maximalist where the whole point is that the interface stays straight faced
while the copy carries the absurdity. It would suit a darker, louder version of
this product. If you want it anyway, say so and I will wire it in as is.
