import {
  db,
  functions,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  httpsCallable,
} from "./firebase.js";

const commentsSection = document.querySelector("[data-comment-section]");

if (commentsSection) {
  const postId = commentsSection.getAttribute("data-post-id");
  const commentsList = commentsSection.querySelector("[data-comments-list]");
  const emptyState = commentsSection.querySelector("[data-comments-empty]");
  const loadingState = commentsSection.querySelector("[data-comments-loading]");
  const errorContainer = commentsSection.querySelector("[data-comments-error]");
  const form = commentsSection.querySelector("[data-comment-form]");
  const successMessage = commentsSection.querySelector("[data-comment-success]");

  const submitComment = httpsCallable(functions, "submitComment");

  const approvedCommentsQuery = query(
    collection(db, "comments"),
    where("postId", "==", postId),
    where("approved", "==", true),
    orderBy("createdAt", "desc")
  );

  onSnapshot(
    approvedCommentsQuery,
    (snapshot) => {
      loadingState?.setAttribute("hidden", "");
      commentsList.innerHTML = "";

      if (snapshot.empty) {
        emptyState?.removeAttribute("hidden");
        return;
      }

      emptyState?.setAttribute("hidden", "");

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement("li");
        li.className = "comment";

        const header = document.createElement("div");
        header.className = "comment__meta";

        const author = document.createElement("strong");
        author.className = "comment__author";
        author.textContent = data.name;
        header.appendChild(author);

        if (data.createdAt?.toDate) {
          const timestamp = data.createdAt.toDate();
          const dateEl = document.createElement("time");
          dateEl.className = "comment__date";
          dateEl.dateTime = timestamp.toISOString();
          dateEl.textContent = timestamp.toLocaleDateString();
          header.appendChild(dateEl);
        }

        li.appendChild(header);

        const message = document.createElement("p");
        message.className = "comment__message";
        message.textContent = data.message;
        li.appendChild(message);

        commentsList.appendChild(li);
      });
    },
    (error) => {
      loadingState?.setAttribute("hidden", "");
      errorContainer.removeAttribute("hidden");
      errorContainer.textContent = `We were unable to load comments (${error.message}).`;
    }
  );

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form) {
      return;
    }

    const formData = new FormData(form);
    const name = formData.get("name");
    const email = formData.get("email");
    const message = formData.get("message");

    errorContainer?.setAttribute("hidden", "");
    successMessage?.setAttribute("hidden", "");

    if (!name || !email || !message) {
      errorContainer.removeAttribute("hidden");
      errorContainer.textContent = "Please complete all required fields before submitting.";
      return;
    }

    if (typeof grecaptcha === "undefined") {
      errorContainer.removeAttribute("hidden");
      errorContainer.textContent = "reCAPTCHA is still loading. Please try again.";
      return;
    }

    const recaptchaToken = grecaptcha.getResponse();
    if (!recaptchaToken) {
      errorContainer.removeAttribute("hidden");
      errorContainer.textContent = "Please confirm you are not a robot before submitting.";
      return;
    }

    try {
      await submitComment({
        name: String(name),
        email: String(email),
        message: String(message),
        postId,
        recaptchaToken,
      });

      form.reset();
      grecaptcha.reset();
      successMessage?.removeAttribute("hidden");
    } catch (error) {
      errorContainer.removeAttribute("hidden");
      errorContainer.textContent = error.message || "We were unable to submit your comment. Please try again.";
    }
  });
}
