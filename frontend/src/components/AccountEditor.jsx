import React, { useState, useEffect } from "react";
import InputField from "./InputField";
import DropdownField from "./DropdownField";
import { memberIdInUse } from "../libraryUtils";

const roleChoices = [
  {
    value: "member",
    label: "Member",
  },
  {
    value: "admin",
    label: "Admin",
  },
];
function AccountEditor(props) {
  const accountBeingEdited = props.accountBeingEdited;
  const [name, setName] = useState("");
  const [membershipId, setMembershipId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(
    function () {
      if (accountBeingEdited !== null) {
        setName(accountBeingEdited.name);
        setMembershipId(accountBeingEdited.membershipId);
        setPassword("");
        setRole(accountBeingEdited.role);
      } else {
        setName("");
        setMembershipId("");
        setPassword("");
        setRole("member");
      }
      setFieldErrors({});
    },
    [accountBeingEdited],
  );

  function handleNameChange(event) {
    setName(event.target.value);
  }

  function handleMembershipIdChange(event) {
    setMembershipId(event.target.value);
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);
  }

  function handleRoleChange(event) {
    setRole(event.target.value);
  }

  function checkFields() {
    const problems = {};
    if (name.trim().length < 2) {
      problems.name = "Please enter a name with at least 2 letters.";
    }
    if (membershipId.trim() === "") {
      problems.membershipId = "Please enter a membership ID.";
    } else {
      let ignoreId = null;
      if (accountBeingEdited !== null) {
        ignoreId = accountBeingEdited.id;
      }
      if (memberIdInUse(props.users || [], membershipId, ignoreId)) {
        problems.membershipId = "That membership ID is already taken.";
      }
    }
    if (accountBeingEdited === null && password === "") {
      problems.password = "Please enter a password.";
    } else if (password !== "" && password.length < 6) {
      problems.password = "The password must be at least 6 characters long.";
    }
    setFieldErrors(problems);
    const problemKeys = Object.keys(problems);
    if (problemKeys.length === 0) {
      return true;
    }

    return false;
  }

  async function submitForm(event) {
    event.preventDefault();
    const fieldsOk = checkFields();
    if (fieldsOk === false) {
      return;
    }
    const userData = {
      name: name.trim(),
      membershipId: membershipId.trim(),
      password: password,
      role: role,
    };
    const stored = await props.onCommit(userData);
    if (stored === true && accountBeingEdited === null) {
      setName("");
      setMembershipId("");
      setPassword("");
      setRole("member");
      setFieldErrors({});
    }
  }
  let heading = "Add a New User";
  let passwordLabel = "Password";
  let passwordPlaceholder = "Password (at least 6 characters)";
  let submitText = "Add User";
  let cancelButton = null;
  if (accountBeingEdited !== null) {
    heading = "Update User";
    passwordLabel = "New Password (optional)";
    passwordPlaceholder = "New password (leave blank to keep the old one)";
    submitText = "Save Changes";
    cancelButton = (
      <button className="act act-quiet" type="button" onClick={props.onAbort}>
        Cancel
      </button>
    );
  }

  return (
    <div className="box">
      <h2>{heading}</h2>
      <form onSubmit={submitForm} noValidate>
        <div className="fields-grid">
          <InputField
            id="name"
            label="Full Name"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Full Name"
            error={fieldErrors.name}
          />
          <InputField
            id="membershipId"
            label="Membership ID"
            type="text"
            value={membershipId}
            onChange={handleMembershipIdChange}
            placeholder="Membership ID"
            error={fieldErrors.membershipId}
          />
          <InputField
            id="password"
            label={passwordLabel}
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder={passwordPlaceholder}
            error={fieldErrors.password}
          />
          <DropdownField
            id="role"
            label="Role"
            value={role}
            onChange={handleRoleChange}
            options={roleChoices}
          />
        </div>
        <div className="form-actions">
          <button className="act" type="submit">
            {submitText}
          </button>
          {cancelButton}
        </div>
      </form>
    </div>
  );
}

export default AccountEditor;
