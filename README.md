# REACH: contact card platform

## Files (upload ALL of these to the top level of your `reach` GitHub repository)
index.html, card.html, admin.html, app.js, cardgen.js, core.js, style.css,
logo-mark.png, favicon.png, icon-192.png, icon-512.png, admin.webmanifest
(logo-full.png is your full logo for posters/profile pictures; it is not used by the site.)

Links:
- Users: https://muhadeen.github.io/reach/
- Admin: https://muhadeen.github.io/reach/admin.html

## Firestore rules (REPLACE everything in Firestore > Rules, then Publish)
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

    // date invite
    match /events/{id}    { allow create: if true; allow read: if isAdmin(); }
    match /responses/{id} { allow create: if true; allow read: if isAdmin(); }

    // account profile (private)
    match /users/{uid} {
      allow get: if isOwner(uid) || isAdmin();
      allow list: if isAdmin();
      allow create: if isOwner(uid);
      allow update, delete: if isOwner(uid) || isAdmin();
    }
    match /private/{uid} {
      allow get: if isOwner(uid) || isAdmin();
      allow list: if isAdmin();
      allow create, update: if isOwner(uid);
      allow delete: if isOwner(uid) || isAdmin();
    }

    // contact cards: anyone with the link can open ONE card; only the owner or admin can list
    match /cards/{id} {
      allow get: if true;
      allow list: if isAdmin() || (request.auth != null && resource.data.owner == request.auth.uid);
      allow create: if request.auth != null && request.resource.data.owner == request.auth.uid;
      allow update: if isAdmin() || (isOwner(resource.data.owner) && request.resource.data.owner == resource.data.owner);
      allow delete: if isAdmin() || isOwner(resource.data.owner);
    }

    // analytics events (views and platform clicks)
    match /hits/{id} {
      allow create: if request.resource.data.keys().hasOnly(['card','owner','type','src','vid','p','ts'])
                    && request.resource.data.type in ['view','click']
                    && request.resource.data.src in ['qr','link']
                    && request.resource.data.card is string
                    && request.resource.data.owner is string;
      allow read: if isAdmin() || (request.auth != null && resource.data.owner == request.auth.uid);
    }

    // feedback from users and visitors
    match /feedback/{id} {
      allow create: if request.resource.data.keys().hasOnly(['name','email','rating','message','from','ts'])
                    && request.resource.data.message is string
                    && request.resource.data.message.size() > 0
                    && request.resource.data.message.size() <= 1500;
      allow read, delete: if isAdmin();
    }
  }
}
```

## Firebase checklist
1. Authentication > Sign-in method > Email/Password enabled.
2. Authentication > Settings > Authorised domains includes muhadeen.github.io.
3. Authentication > Settings > User actions: "Enable create (sign-up)" ON.
4. Admin account mollyeen77@gmail.com exists (Authentication > Users). Do not sign up with it on the public page.
5. Rules above published.
6. Authentication > Templates > Password reset: sender name REACH (optional).

## Admin without opening GitHub
Bookmark https://muhadeen.github.io/reach/admin.html.
Phone: Chrome menu > Add to Home screen (iPhone: Safari Share > Add to Home Screen). It opens like an app called "REACH Admin".
When you are logged into the main site with the admin email, an "Admin" button appears at the top.
