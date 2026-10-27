import React, { useState, useCallback } from "react";
import InputField from "../components/InputField";
import Notice from "../components/Notice";
import { signIn } from "../serverApi";

function SignInPage(props) {
  const [membershipId, setMembershipId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [signInError, setSignInError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const clearSignInError = useCallback(function () {
    setSignInError("");
  }, []);

  function handleMembershipIdChange(event) {
    setMembershipId(event.target.value);
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);
  }

  function togglePasswordVisible(event) {
    setPasswordVisible(event.target.checked);
  }

  async function submitForm(event) {
    event.preventDefault();

    const problems = {};
    if (membershipId.trim() === "") {
      problems.membershipId = "Please enter your membership ID.";
    }
    if (password === "") {
      problems.password = "Please enter your password.";
    }
    setFieldErrors(problems);
    setSignInError("");

    if (Object.keys(problems).length > 0) {
      return;
    }

    setSigningIn(true);
    try {
      const matchedUser = await signIn(membershipId, password);
      props.onSignedIn(matchedUser);
    } catch (error) {
      setSignInError(error.message);
      setSigningIn(false);
    }
  }

  let passwordInputType = "password";
  if (passwordVisible === true) {
    passwordInputType = "text";
  }

  return (
    <div className="signin">
      <section className="signin-art">
        <div className="signin-art-text">
          <span className="brand-mark">HM</span>
          <h1>Ha Molibetsane Community Library</h1>
          <p>Browse the shelves, borrow a book and keep track of every loan in one place.</p>
        </div>
      </section>

      <section className="signin-panel">
        <div className="signin-card">
          <h2>Welcome back</h2>
          <p className="signin-lead">Sign in with your membership ID to continue.</p>
          <Notice type="error" text={signInError} onDismiss={clearSignInError} />
          <form className="signin-form" onSubmit={submitForm} noValidate>
            <InputField
              id="membershipId"
              label="Membership ID"
              type="text"
              value={membershipId}
              onChange={handleMembershipIdChange}
              placeholder="e.g. MEM0042"
              error={fieldErrors.membershipId}
            />
            <InputField
              id="password"
              label="Password"
              type={passwordInputType}
              value={password}
              onChange={handlePasswordChange}
              placeholder="Your password"
              error={fieldErrors.password}
            />
            <label className="reveal-password">
              <input type="checkbox" checked={passwordVisible} onChange={togglePasswordVisible} />
              Show password
            </label>
            <button className="act act-wide" type="submit" disabled={signingIn}>
              {signingIn ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default SignInPage;
