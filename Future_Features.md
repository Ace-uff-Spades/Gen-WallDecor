## Features

---

## Priority 1

### Regenerate individual pictures
- After the first generation. Users can pick particular pictures to recreate. The recreated pictures will be in line with the other pictures that were already produced.
- Users can add an optional description of how they want to change that individual picture
- We reproduce the "Your Wall" picture with the new set of wall decor.

### Shopping Links
- Need to own the end-to-end pipeline of going from generating images to hanging them up on a user's wall. This requires a few things
	- Links to buying the right frames. The right size and the right material.
	- Links to printing out the pictures, i.e. at a staples or an online printing service
- Also need shopping links for anything that's not a poster. We might be able to leverage google shopping for this.
- Initial implementation: construct Google Shopping search URLs from piece dimensions/material/title (no API needed).
- Future improvement: integrate Google Shopping API directly to surface specific product listings with prices in-app.

### Download only the subject of posters
- When we generate a poster, the download feature should only download the picture in subject and not a picture of the subject within a frame.

### Objects
- Objects that we showcase as wall decor shouldn't have a download a print button. Instead they should have shopping links for where the user can buy the items. Reference Shopping links feature for more details.

---

## Priority 2

### Improve the generate intake flow
- Instead having "room" as a drop down. Create a boxes the user can select.
- Size of the room should also have height.
- We should be able to take a picture from the user and use that as a basis for the styles we're using.

### Model selection for image generation
- Allow users to choose which AI model is used for picture generation (e.g. Gemini 2.5 Flash vs a higher-quality/slower model).
- Different models may produce different aesthetic results; power users should be able to opt into better quality at the cost of speed.

### UI improvement
- The UI right now is really tacky and not well done. Let's work with Figma AI or another design orientated AI to redo the UI style from the ground up.
- Color scheme also isn't that great
- We need to change it from "side project" look to "professional product" ready to scale with users

---

## Priority 3

### Fine-tune model
- We need to give the model some examples or popular choices of wall decor pieces within each of the interior decor styles. i.e. the New York magazine posters, or jackson pollicks.
- This can be trained on pintrest pictures, or pictures from popular interior decoration companies

### Evals
- To improve reliance, we need to implement a evals system for production picture generations. We need to see if the pictures are actually aligned with the style that the user has chosen and/or reflect the changes they wanted to their descriptions.
