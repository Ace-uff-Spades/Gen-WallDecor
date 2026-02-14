# Gen Wall Decor PRD

## Problem 
Decorarting is hard. Decorting with intention and matching styles so they aren't conflicting is harder. 

People want a beautiful home but don't understand how to make one through decorations. Especially wall decor. Walls of a home are the canvas for people to produce a style, and curate a vibe in their spaces. It's very important that they choose correctly and ensure their cohesiveness throughout their wall decor. 


## Goal 

- Understand the user's vision for their wall. This includes their color scheme, subjects, lighting, patterns, materials, functionalities, and themes.
- Help users curate multiple pictures, posters, visuals, furniture, and objects that fit together in a cohesive way to fit their vision.
- Users can see our suggestions in a detailed, and immersive experience. 


## CUJs 

Users pick the type of wall they want to decorate. 
- They pick from a list of pre-selected home decor styles such as: 
Transitional, Traditional, Modern, Eclectic,Contemporary, Minimalist, Mid Century Modern,Bohemian, Modern Farmhouse, Shabby Chic, Coastal, Hollywood Glam,Southwestern, Rustic, Industrial, French Country, Scandinavian, Mediterranean, Art Deco, Asian Zen. 
- They pick the type of visuals they want from a pre-set list. i.e. Color Scheme, type of wood for the posters
- We combine the preferences that the user chose to produce a wall that fits all of their criteria 
- Showcase a 3D rendering of the wall with the decor. 
- Showcase the images for each individual posters, and allow the user to save them.
- Have retry logic for the user with changes they want to see to the wall decor. 

History
- Users will have the ability to see their past 3 wall generations. 
- We delete anything before the last 3 wall decor generations 
- We give users affordance on the history rules 

Auth
- Users must login with their Gmail. 
- Each user gets 10 generations a day



## Technical Details 
- App Built in Nextjs frontend, Node backend 
- Image Generation Model: Gemini 2.5 Flash Image
- Regular LLM calls: GPT 4o-nano 
Backend design: 
- Firebase Auth for Authentication
- Use Firebase Firestore for persistence and memory 
- Google Cloud Storage for any any blobstore usage


## Frontend Design 
- Frontend Color Scheme: #1b998b, #f8f1ff, #decdf5, #656176, #534d56
- Frontend Notes: Soft edges, Modern, minimalist, no dark mode 

## Testing 
- Must follow test based developement while making the app 
- Build a evaluation pipeline for the wall decor generations. This should includes validation that the decor matches the styles that the user picked.
- We have a pipeline to test different image models so that we can pick the best one for our use case 

## Project Directory 
Create a docs folder. Create the following files: 
- Create a project_state.md file. Updated frequently with the most update to date state of the project  
- Create a architecture.md file. Updated with the technical architecture and technical decisions made 
- Context management file. Tips and tricks on how to be the most effective use of the current context window. Helps avoid context degradation. 
- CI/CD and collaboration will be done through the docs folder in case multiple agents are working on the codebase at the same time.


## Config 
- Disable Auth initally for testing purposes 
- My Firebase Config: 
const firebaseConfig = {
  apiKey: "AIzaSyDL-F_1uZKu8XLTGMRGFPJzoRYlD7sAUPc",
  authDomain: "walldecorgen.firebaseapp.com",
  projectId: "walldecorgen",
  storageBucket: "walldecorgen.firebasestorage.app",
  messagingSenderId: "838129573192",
  appId: "1:838129573192:web:bd602ecc2daf15e095277d",
  measurementId: "G-84RGEPE5C8"
};
- I already enabled Firebase Auth and Firbase Firestore
- Google Cloud Storage bucket: walldecorgen-bucket-1 
- Our GCS bucket doesn't have public access yet, but the firebase admin service account has access: firebase-adminsdk-fbsvc@walldecorgen.iam.gserviceaccount.com








