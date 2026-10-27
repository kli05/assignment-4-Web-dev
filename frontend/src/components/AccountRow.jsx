import React from "react";
import { roleText } from "../libraryUtils";

function AccountRow(props) {
  const user = props.user;

  function beginEdit() {
    props.onEdit(user);
  }

  function confirmDelete() {
    props.onRemove(user);
  }
  let youNote = null;
  if (user.id === props.activeUserId) {
    youNote = <span className="self-note"> (you)</span>;
  }

  return (
    <tr>
      <td>
        {user.name}
        {youNote}
      </td>
      <td>{user.membershipId}</td>
      <td>
        <span className="role-pill">{roleText(user.role)}</span>
      </td>
      <td>{props.loanTotal}</td>
      <td>
        <div className="row-actions">
          <button type="button" onClick={beginEdit}>
            Update
          </button>
          <button className="is-danger" type="button" onClick={confirmDelete}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default AccountRow;
