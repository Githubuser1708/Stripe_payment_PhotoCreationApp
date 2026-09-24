# Cinematic Photos

An AI-powered application that transforms uploaded photos into cinematic, visually compelling images.

Built with **Google AI Studio**, this application allows users to upload a headshot or full-body photo, select an outfit and a cinematic vibe from the available options in the app, and generate a new cinematic image of the person wearing the selected outfit and posing in a visually immersive environment.

## ✨ Overview

## **Cinematic Photos** uses generative AI to create professional-looking cinematic images from user-provided photos.

**URL : https://copy-photocreation.ai.studio**

The application combines:

- 👤 User-uploaded headshot or full-body photos
- 👗 Selected outfits or fashion styles
- 🎬 Cinematic vibes (Background / Locations) available in the application
- 🤖 AI-generated image transformation

The result is a new AI-generated image that places the person in a cinematic environment, wearing the selected outfit and posing naturally according to the selected vibe, with custom prompt to fine tune the details of the photo.

## **Workflow of the PhotoCreation**
## 🧠 How It Works 

1. User generates a photo. 
2. Store the full-resolution image securely in private Google Cloud Storage (GCS_Bucket_Name) . 
3. Send only a preview/lower-resolution image to the browser. 
4. Give the image a unique imageId. 
5. User clicks "Download High Res". 
6. Create a NEW Stripe Checkout Session (TEST Mode). 
7. Customer makes the payment. 
8. Create a new /payment-success page. 
9. The page reads the session_id. 
10. The page calls a backend endpoint to verify the payment. 
11. The backend retrieves the Checkout Session directly from Stripe using STRIPE_SECRET_KEY. 
12. The backend checks: payment_status === "paid" 
13. The backend gets the imageId from the Stripe session metadata. 
14. Verify that the imageId exists and belongs to the stored image. 
15. Generate a short-lived secure download URL for the private high-resolution image. 
16. Return the download URL to the payment-success page. 
17. Show: "Payment Successful" "Your high-resolution photo is ready." 
18. Provide a: "Download High Resolution" button that downloads the high-resolution image.

Workflow Diagram below

<div align="left">
<img width="300" height="450" alt="GHBanner" src="https://github.com/Githubuser1708/Stripe_payment_PhotoCreationApp/blob/main/blob/workflow.png"/>
</div>
</>



## 🚀 Features

### Example of the CinematicPhoto App UI and generated Photos



### 📸 Upload Your Photo

Users can upload up to 3 photos:
- Headshots
- Full-body photos
- Portrait photos

The AI uses the uploaded image as a reference for generating the final cinematic image.

### 👕 Select an Outfit (Optional)

Users can select an outfit or fashion style available in the application.

The AI generates the person wearing the selected outfit while maintaining the visual identity of the uploaded person as closely as possible.

### 🎬 Select a Cinematic Vibe

Users can select from the cinematic vibe options available in the application.

The selected vibe influences the visual atmosphere, mood, styling, lighting, composition and overall cinematic appearance of the generated image.


### 🖼️ Generate Cinematic Photos

The AI combines the user's:
1. Uploaded photo
2. Selected outfit
3. Selected cinematic vibe
 E.g Corporate Shoot,
     Casual Shoot,
     Graduation Shoot,
     Baby Photoshoot.
     Personal Makeover Shoot

It then generates a cinematic image showing the person wearing the selected outfit and naturally posed within a visually immersive environment based on the selected vibe.

### 🖼️ Stripe Payment (Test Mode) Activated (pop up) upon Clicking of Download High Resolution image button

Users can enter the testing Card Payment (Test mode) details provide by Stripe url https://docs.stripe.com/testing 
Upon entering the card payment and successful payment verification


### 🖼️ Upon Successful Stripe Payment, User allowed to Download the high resolution image

