# REACH: contact card platform

## Put it in its OWN GitHub repository
1. github.com > New repository > name it `reach` > Public > Create.
2. Click "uploading an existing file" and drag in these files (all in the ROOT, not inside a folder):
   index.html, card.html, admin.html, core.js, style.css, logo-mark.png, favicon.png (logo-full.png is the full logo for your own use) > Commit changes. If you uploaded logo.svg or logo.png earlier, you can delete them.
3. Settings > Pages > Deploy from a branch > main > / (root) > Save. Wait 1-2 minutes.

Your links (if the repo is named `reach`):
- Users:  https://muhadeen.github.io/reach/
- Admin:  https://muhadeen.github.io/reach/admin.html

Firebase: nothing new to add. `muhadeen.github.io` is already an authorised domain, and the config is already inside core.js.

## Firestore rules (REPLACE all existing rules, then Publish)
These keep your date-invite rules AND add the Reach rules.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null && request.auth.token.email == 'mollyeen77@gmail.com';
    }
    function isOwner(uid) {
      return request.auth != null && request.auth.uid == uid;
    }

    // ---- Date invite ----
    match /events/{id}    { allow create: if true; allow read: if isAdmin(); }
    match /responses/{id} { allow create: if true; allow read: if isAdmin(); }

    // ---- Reach: public card (anyone with the link can open ONE card, only admin can list all) ----
    match /users/{uid} {
      allow get: if true;
      allow list: if isAdmin();
      allow create: if isOwner(uid);
      allow update: if isOwner(uid) || isAdmin()
        || (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['views'])
            && request.resource.data.views == resource.data.views + 1);
      allow delete: if isOwner(uid) || isAdmin();
    }

    // ---- Reach: private info (email) ----
    match /private/{uid} {
      allow get: if isOwner(uid) || isAdmin();
      allow list: if isAdmin();
      allow create, update, delete: if isOwner(uid) || (isAdmin() && request.method == 'delete');
    }
  }
}
```


## Firebase activation checklist (login + admin)
1. Authentication > Sign-in method > Email/Password > Enable > Save. (Needed so the PUBLIC can sign up.)
2. Authentication > Settings > Authorised domains: `muhadeen.github.io` must be listed.
3. Authentication > Settings > User actions: "Enable create (sign-up)" must stay ON.
4. Authentication > Users: your admin account `mollyeen77@gmail.com` must exist. The email must match ADMIN_EMAIL in core.js and the rules above. Do NOT delete it.
5. Firestore Database > Rules: paste the rules above > Publish.
6. Authentication > Templates > Password reset: set sender name to REACH (optional, but looks professional).
7. Test: sign up > log out > log in with a wrong password (you should see an error) > log in correctly > "Forgot password?" > admin login.
