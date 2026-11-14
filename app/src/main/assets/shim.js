// Replaces the claude.ai runtime APIs with Firebase Auth + Firestore.
(function(){
  var C=window.YP_CONFIG;
  firebase.initializeApp(C.firebase);
  var auth=firebase.auth(), fs=firebase.firestore();
  try{fs.settings({experimentalAutoDetectLongPolling:true,merge:true})}catch(e){}
  var admins=(C.adminEmails||[]).map(function(e){return e.toLowerCase()});
  function isAdmin(u){return !!(u&&u.email&&u.emailVerified&&admins.indexOf(u.email.toLowerCase())>-1)}

  var css=document.createElement("style");
  css.textContent="#ypl{position:fixed;inset:0;z-index:99999;background:#0b0d12;color:#eef;display:none;align-items:center;justify-content:center;padding:20px;font-family:system-ui,sans-serif}"+
  "#ypl .b{width:100%;max-width:360px}#ypl h1{margin:0 0 4px;font-size:28px;letter-spacing:2px}#ypl p{margin:0 0 18px;color:#9aa}"+
  "#ypl button,#ypl input{width:100%;box-sizing:border-box;padding:13px;margin:6px 0;border-radius:10px;border:1px solid #334;font-size:15px}"+
  "#ypl input{background:#161a24;color:#fff}#ypl button{background:#f5a524;color:#111;font-weight:700;border:0}"+
  "#ypl button.g{background:#fff;color:#222}#ypl button.s{background:transparent;color:#9ab;border:1px solid #334}"+
  "#ypl .e{color:#ff7b7b;min-height:20px;font-size:13px}#ypl .m{text-align:center;color:#778;margin:8px 0;font-size:12px}"+
  "#ypo{position:fixed;top:6px;right:6px;z-index:9999;width:30px;height:30px;border-radius:50%;background:#f5a524;color:#111;font:700 14px system-ui;display:none;align-items:center;justify-content:center;opacity:.85}";
  document.head.appendChild(css);
  var box=document.createElement("div");box.id="ypl";
  box.innerHTML='<div class="b"><h1>YAPPER</h1><p>Sign in to join BGMI tournaments</p>'+
   '<button class="g" id="ypg">Continue with Google</button><div class="m">or use email</div>'+
   '<input id="ype" type="email" placeholder="Email" autocomplete="email"><input id="ypp" type="password" placeholder="Password (min 6)" autocomplete="current-password">'+
   '<div class="e" id="yper"></div><button id="ypi">Sign in</button><button class="s" id="ypc">Create account</button><button class="s" id="ypf">Forgot password</button></div>';
  var chip=document.createElement("div");chip.id="ypo";
  function mount(){document.body.appendChild(box);document.body.appendChild(chip);wire()}
  function $(i){return document.getElementById(i)}
  function err(e){var m=(e&&(e.code||e.message))||String(e);
    var map={"auth/invalid-credential":"Wrong email or password","auth/wrong-password":"Wrong email or password","auth/user-not-found":"No account with this email","auth/email-already-in-use":"Email already registered - sign in instead","auth/weak-password":"Password needs 6+ characters","auth/invalid-email":"Invalid email","auth/network-request-failed":"No internet connection","auth/too-many-requests":"Too many tries, wait a bit"};
    $("yper").textContent=map[m]||m}
  function wire(){
    $("ypg").onclick=function(){$("yper").textContent="";
      if(window.Android&&Android.googleSignIn)Android.googleSignIn(C.googleWebClientId);
      else auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(err)};
    $("ypi").onclick=function(){$("yper").textContent="";auth.signInWithEmailAndPassword($("ype").value.trim(),$("ypp").value).catch(err)};
    $("ypc").onclick=function(){$("yper").textContent="";
      auth.createUserWithEmailAndPassword($("ype").value.trim(),$("ypp").value).then(function(r){try{r.user.sendEmailVerification()}catch(e){}}).catch(err)};
    $("ypf").onclick=function(){var e=$("ype").value.trim();if(!e){$("yper").textContent="Type your email first";return}
      auth.sendPasswordResetEmail(e).then(function(){$("yper").textContent="Reset link sent - check your email"}).catch(err)};
    chip.onclick=function(){if(confirm("Sign out?"))auth.signOut().then(function(){location.reload()})};
  }
  window.ypGoogleResult=function(tok,e){
    if(e){$("yper").textContent=e;return}
    auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(tok)).catch(err)};
  if(document.body)mount();else document.addEventListener("DOMContentLoaded",mount);

  var userP=new Promise(function(res){
    auth.onAuthStateChanged(function(u){
      if(u){box.style.display="none";chip.style.display="flex";chip.textContent=(u.displayName||u.email||"?").charAt(0).toUpperCase();
        res({id:function(){return Promise.resolve(u.uid)},isOwner:function(){return Promise.resolve(isAdmin(u))},canEdit:function(){return Promise.resolve(isAdmin(u))}})}
      else{box.style.display="flex";chip.style.display="none"}
    });
  });
  window.claude={use:function(n){
    if(n==="user")return userP;
    if(n==="db")return userP.then(function(){return fs});
    return Promise.resolve(null);
  }};
})();
