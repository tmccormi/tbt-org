import {
  auth,
  db,
  functions,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  onAuthStateChanged,
  signOut,
  httpsCallable,
} from "./firebase.js";

const allowedModerators = (window.__ALLOWED_MODERATORS__ || []).map((email) =>
  String(email || "").toLowerCase()
);

const moderationWidgetContainer = document.getElementById("moderation-recaptcha");
let moderationWidgetId = null;

function executeRecaptcha() {
  return new Promise((resolve, reject) => {
    if (typeof grecaptcha === "undefined") {
      reject(new Error("reCAPTCHA is not available."));
      return;
    }

    const siteKey = window.__RECAPTCHA_SITE_KEY__;
    if (!siteKey) {
      reject(new Error("reCAPTCHA site key is missing."));
      return;
    }

    const renderWidget = () => {
      if (moderationWidgetId === null && moderationWidgetContainer) {
        moderationWidgetId = grecaptcha.render(moderationWidgetContainer, {
          sitekey: siteKey,
          size: "invisible",
        });
      }

      if (moderationWidgetId === null) {
        reject(new Error("Unable to render reCAPTCHA widget."));
        return;
      }

      grecaptcha.reset(moderationWidgetId);
      grecaptcha
        .execute(moderationWidgetId)
        .then((token) => {
          if (!token) {
            reject(new Error("Failed to retrieve a reCAPTCHA token."));
            return;
          }

          resolve(token);
        })
        .catch((error) => reject(error));
    };

    grecaptcha.ready(renderWidget);
  });
}

const submitModeration = httpsCallable(functions, "moderateComment");

const authContainer = document.getElementById("firebaseui-auth-container");
const signedInContainer = document.getElementById("comment-admin");
const unauthorizedContainer = document.getElementById("comment-admin-unauthorized");
const pendingList = document.querySelector("[data-pending-comments]");
const approvedList = document.querySelector("[data-approved-comments]");
const statusMessage = document.querySelector("[data-admin-status]");

function clearList(element) {
  if (element) {
    element.innerHTML = "";
  }
}

function createCommentItem(doc) {
  const data = doc.data();
  const li = document.createElement("li");
  li.className = "moderation__item";
  li.dataset.commentId = doc.id;

  const message = document.createElement("p");
  message.className = "moderation__message";
  message.textContent = data.message;

  const meta = document.createElement("p");
  meta.className = "moderation__meta";
  const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
  const createdLabel = createdAt ? createdAt.toLocaleString() : "Unknown date";
  meta.textContent = `${data.name} • ${data.email} • ${createdLabel}`;

  const actions = document.createElement("div");
  actions.className = "moderation__actions";

  const approveButton = document.createElement("button");
  approveButton.type = "button";
  approveButton.textContent = "Approve";
  approveButton.dataset.action = "approve";
  approveButton.dataset.commentId = doc.id;

  const rejectButton = document.createElement("button");
  rejectButton.type = "button";
  rejectButton.textContent = "Reject";
  rejectButton.dataset.action = "reject";
  rejectButton.dataset.commentId = doc.id;

  actions.appendChild(approveButton);
  actions.appendChild(rejectButton);

  li.appendChild(message);
  li.appendChild(meta);
  li.appendChild(actions);

  return li;
}

async function handleModeration(commentId, approved) {
  if (statusMessage) {
    statusMessage.textContent = "Submitting moderation decision…";
  }
  try {
    const recaptchaToken = await executeRecaptcha();
    await submitModeration({ commentId, approved, recaptchaToken });
    if (statusMessage) {
      statusMessage.textContent = "Moderation updated.";
    }
  } catch (error) {
    if (statusMessage) {
      statusMessage.textContent =
        error.message || "An error occurred while updating the comment.";
    }
  }
}

function attachModerationHandlers(container) {
  container.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.action;
    const commentId = target.dataset.commentId;

    if (!action || !commentId) {
      return;
    }

    handleModeration(commentId, action === "approve");
  });
}

if (pendingList) {
  attachModerationHandlers(pendingList);
}

if (approvedList) {
  attachModerationHandlers(approvedList);
}

let unsubscribePending = null;
let unsubscribeApproved = null;

function tearDownListeners() {
  if (typeof unsubscribePending === "function") {
    unsubscribePending();
  }
  if (typeof unsubscribeApproved === "function") {
    unsubscribeApproved();
  }
  unsubscribePending = null;
  unsubscribeApproved = null;
}

function renderComments() {
  const commentsRef = collection(db, "comments");

  const pendingQuery = query(
    commentsRef,
    where("approved", "==", false),
    orderBy("createdAt", "desc")
  );

  const approvedQuery = query(
    commentsRef,
    where("approved", "==", true),
    orderBy("createdAt", "desc")
  );

  tearDownListeners();

  unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
    if (!pendingList) {
      return;
    }
    clearList(pendingList);
    if (snapshot.empty) {
      const item = document.createElement("li");
      item.textContent = "No comments are awaiting review.";
      pendingList.appendChild(item);
      return;
    }

    snapshot.forEach((doc) => pendingList.appendChild(createCommentItem(doc)));
  });

  unsubscribeApproved = onSnapshot(approvedQuery, (snapshot) => {
    if (!approvedList) {
      return;
    }
    clearList(approvedList);
    if (snapshot.empty) {
      const item = document.createElement("li");
      item.textContent = "No comments have been approved yet.";
      approvedList.appendChild(item);
      return;
    }

    snapshot.forEach((doc) => approvedList.appendChild(createCommentItem(doc)));
  });
}

function initializeUi() {
  const uiConfig = {
    signInFlow: "popup",
    signInOptions: ["google.com"],
    callbacks: {
      signInSuccessWithAuthResult: () => false,
    },
  };

  if (window.firebaseui && authContainer) {
    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);
    ui.start("#firebaseui-auth-container", uiConfig);
  }
}

initializeUi();

authContainer?.removeAttribute("hidden");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    tearDownListeners();
    signedInContainer?.setAttribute("hidden", "");
    unauthorizedContainer?.setAttribute("hidden", "");
    authContainer?.removeAttribute("hidden");
    return;
  }

  const email = String(user.email || "").toLowerCase();
  if (!allowedModerators.includes(email)) {
    tearDownListeners();
    signedInContainer?.setAttribute("hidden", "");
    authContainer?.setAttribute("hidden", "");
    unauthorizedContainer?.removeAttribute("hidden");
    if (statusMessage) {
      statusMessage.textContent = "You are signed in but not authorized to moderate comments.";
    }
    return;
  }

  authContainer?.setAttribute("hidden", "");
  unauthorizedContainer?.setAttribute("hidden", "");
  signedInContainer?.removeAttribute("hidden");
  if (statusMessage) {
    statusMessage.textContent = "Loading comments…";
  }
  renderComments();
});

const signOutButtons = document.querySelectorAll("[data-sign-out]");
signOutButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    await signOut(auth);
  });
});
