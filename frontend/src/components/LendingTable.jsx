import React from "react";
import LendingRow from "./LendingRow";

function LendingTable(props) {
  if (props.records.length === 0) {
    return <p className="empty-note">{props.emptyNote}</p>;
  }
  const rows = [];
  for (let i = 0; i < props.records.length; i = i + 1) {
    rows.push(
      <LendingRow
        key={props.records[i].id}
        record={props.records[i]}
        withMember={props.withMember}
        withReturnDate={props.withReturnDate}
        onCheckin={props.onCheckin}
        checkinLabel={props.checkinLabel}
      />,
    );
  }
  let memberHeading = null;
  if (props.withMember === true) {
    memberHeading = <th>Member</th>;
  }
  let returnedHeading = null;
  if (props.withReturnDate === true) {
    returnedHeading = <th>Returned On</th>;
  }
  let actionHeading = null;
  if (props.onCheckin) {
    actionHeading = <th>Action</th>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {memberHeading}
            <th>Book</th>
            <th>Borrowed On</th>
            <th>Due Date</th>
            {returnedHeading}
            <th>Status</th>
            {actionHeading}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

export default LendingTable;
