import React from "react";
import { showDate, loanState, loanStateText, loanTagClass, dueNote } from "../libraryUtils";

function LendingRow(props) {
  const record = props.record;
  const status = loanState(record);

  function handleReturnClick() {
    props.onCheckin(record);
  }
  let memberCell = null;
  if (props.withMember === true) {
    memberCell = (
      <td>
        {record.userName}
        <span className="sub-note">{record.membershipId}</span>
      </td>
    );
  }
  let dueReminder = null;
  const dueText = dueNote(record);
  if (dueText !== "") {
    dueReminder = <span className="sub-note">{dueText}</span>;
  }
  let returnedCell = null;
  if (props.withReturnDate === true) {
    returnedCell = <td>{showDate(record.returnedAt)}</td>;
  }
  let actionCell = null;
  if (props.onCheckin) {
    if (record.returnedAt === null) {
      actionCell = (
        <td>
          <div className="row-actions">
            <button className="is-quiet" type="button" onClick={handleReturnClick}>
              {props.checkinLabel}
            </button>
          </div>
        </td>
      );
    } else {
      actionCell = <td>-</td>;
    }
  }
  let rowClass = "";
  if (status === "overdue") {
    rowClass = "row-danger";
  }

  return (
    <tr className={rowClass}>
      {memberCell}
      <td>{record.bookTitle}</td>
      <td>{showDate(record.borrowedAt)}</td>
      <td>
        {showDate(record.dueAt)}
        {dueReminder}
      </td>
      {returnedCell}
      <td>
        <span className={loanTagClass(status)}>{loanStateText(status)}</span>
      </td>
      {actionCell}
    </tr>
  );
}

export default LendingRow;
