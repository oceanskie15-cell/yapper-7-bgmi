# YAPPER APK (Firebase login)
1. Firebase console: create project > Authentication > enable Google AND Email/Password.
2. Project settings > add an ANDROID app: package com.yapper.bgmi, SHA-1 from SETUP below. Add a WEB app too.
3. Fill app/src/main/assets/firebase-config.js. Put your admin Gmail in it and in firestore.rules.
4. Firestore Database > create (production mode) > Rules tab > paste firestore.rules > Publish.
5. Push to GitHub (main). Actions > Build APK > download YAPPER-apk.
