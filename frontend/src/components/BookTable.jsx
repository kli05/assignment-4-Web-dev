import React from "react";
import BookTableRow from "./BookTableRow";

function BookTable(props) {
  if (props.books.length === 0) {
    return <p className="empty-note">There are no books yet. Use the form above to add the first one.</p>;
  }
  const rows = [];
  for (let i = 0; i < props.books.length; i = i + 1) {
    rows.push(
      <BookTableRow
        key={props.books[i].id}
        book={props.books[i]}
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
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
            <th>ISBN</th>
            <th>Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

export default BookTable;
