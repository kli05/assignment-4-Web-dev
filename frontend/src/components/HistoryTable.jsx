import React from "react";
import { showDateTime } from "../libraryUtils";

function HistoryTable(props) {
  if (props.transactions.length === 0) {
    return <p className="empty-note">No transactions have been recorded yet.</p>;
  }
  const rows = [];
  for (let i = 0; i < props.transactions.length; i = i + 1) {
    const item = props.transactions[i];
    let sign = "+";
    if (item.type === "Book Borrowed") {
      sign = "-";
    }
    if (item.type === "Stock Deducted") {
      sign = "-";
    }
    let memberText = "-";
    if (item.memberName) {
      memberText = item.memberName;
    }
    rows.push(
      <tr key={item.id}>
        <td>{showDateTime(item.date)}</td>
        <td>{item.bookTitle}</td>
        <td>{item.type}</td>
        <td>
          {sign}
          {item.quantity}
        </td>
        <td>{item.stockAfter}</td>
        <td>{memberText}</td>
        <td>{item.recordedBy}</td>
      </tr>,
    );
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Book</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Stock After</th>
            <th>Member</th>
            <th>Recorded By</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

export default HistoryTable;
