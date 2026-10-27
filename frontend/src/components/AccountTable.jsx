import React from "react";
import AccountRow from "./AccountRow";

function AccountTable(props) {
  if (props.users.length === 0) {
    return <p className="empty-note">There are no users yet.</p>;
  }
  const rows = [];
  for (let i = 0; i < props.users.length; i = i + 1) {
    rows.push(
      <AccountRow
        key={props.users[i].id}
        user={props.users[i]}
        activeUserId={props.activeUserId}
        loanTotal={props.loanTotals[props.users[i].id]}
        onEdit={props.onEdit}
        onRemove={props.onRemove}
      />,
    );
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Membership ID</th>
            <th>Role</th>
            <th>Books on Loan</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

export default AccountTable;
