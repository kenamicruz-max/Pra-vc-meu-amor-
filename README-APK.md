# Para você, meu amor ♡ — Android APK

This project wraps the VJK5.10 web experience in a native Android shell while keeping the UI/content architecture modular.

## Content updates without a new APK
The app checks:
`https://pra-vc-vidinha-jk.netlify.app/content/manwhas.json`

If that JSON changes, the app downloads the new catalog to local storage and reloads the UI. The app itself does not need a new APK for catalog-only changes.

## Adding a manhwa
Edit only `content/manwhas.json` and add one object following the existing schema. The app generates cards, category placement, search, favorites and recommendation surfaces from the data. No HTML card needs to be manually created.

For a new cover you can use a local asset path such as `assets/covers/new-book.jpg`, or a remote HTTPS image URL if the content is hosted remotely.

## Build
Open the folder in Android Studio with Android SDK 35 installed and build a debug APK. This environment does not include the Android SDK/Gradle toolchain, so the APK binary could not be compiled here.
