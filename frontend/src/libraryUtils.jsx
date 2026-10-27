export const LOW_STOCK_THRESHOLD = 2;
export const LOAN_LIMIT = 3;
export const LOAN_PERIOD_DAYS = 14;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
export function stockLevel(quantity) {
  if (quantity <= 0) {
    return "out";
  }
  if (quantity <= LOW_STOCK_THRESHOLD) {
    return "low";
  }

  return "ok";
}

export function stockLevelText(quantity) {
  const status = stockLevel(quantity);
  if (status === "out") {
    return "Out of stock";
  }
  if (status === "low") {
    return "Low stock";
  }

  return "In stock";
}

export function stockRowClass(quantity) {
  const status = stockLevel(quantity);
  if (status === "low") {
    return "row-warn";
  }
  if (status === "out") {
    return "row-danger";
  }

  return "";
}

export function stockTileClass(quantity) {
  const status = stockLevel(quantity);
  if (status === "low") {
    return "tile tile-low";
  }
  if (status === "out") {
    return "tile tile-out";
  }

  return "tile";
}

export function roleText(role) {
  if (role === "admin") {
    return "Admin";
  }

  return "Member";
}

export function showDate(isoText) {
  if (!isoText) {
    return "-";
  }
  const dateObject = new Date(isoText);
  return dateObject.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function loanState(record) {
  const dueTime = new Date(record.dueAt).getTime();
  if (record.returnedAt !== null) {
    const returnedTime = new Date(record.returnedAt).getTime();
    if (returnedTime > dueTime) {
      return "returned-late";
    }

    return "returned";
  }
  if (Date.now() > dueTime) {
    return "overdue";
  }

  return "on-loan";
}

export function loanStateText(status) {
  if (status === "overdue") {
    return "Overdue";
  }
  if (status === "returned") {
    return "Returned";
  }
  if (status === "returned-late") {
    return "Returned late";
  }

  return "On loan";
}

export function loanTagClass(status) {
  if (status === "overdue") {
    return "tag tag-out";
  }
  if (status === "returned") {
    return "tag tag-ok";
  }
  if (status === "returned-late") {
    return "tag tag-low";
  }

  return "tag";
}

export function dueNote(record) {
  const status = loanState(record);
  const dueTime = new Date(record.dueAt).getTime();
  if (status === "overdue") {
    let daysLate = Math.floor((Date.now() - dueTime) / MS_PER_DAY);
    if (daysLate < 1) {
      daysLate = 1;
    }
    if (daysLate === 1) {
      return "Overdue by 1 day";
    }

    return "Overdue by " + daysLate + " days";
  }
  if (status === "on-loan") {
    const daysLeft = Math.ceil((dueTime - Date.now()) / MS_PER_DAY);
    if (daysLeft <= 1) {
      return "Due within 1 day";
    }

    return "Due in " + daysLeft + " days";
  }

  return "";
}

export function showDateTime(isoText) {
  if (!isoText) {
    return "-";
  }

  return new Date(isoText).toLocaleString();
}

function cleanIsbn(isbn) {
  let cleaned = isbn.replace(/-/g, "");
  cleaned = cleaned.replace(/ /g, "");
  return cleaned.toLowerCase();
}

export function isbnInUse(books, isbn, ignoreId) {
  const wanted = cleanIsbn(isbn);
  for (let i = 0; i < books.length; i = i + 1) {
    if (cleanIsbn(books[i].isbn) === wanted && books[i].id !== ignoreId) {
      return true;
    }
  }

  return false;
}

export function memberIdInUse(users, membershipId, ignoreId) {
  const wanted = membershipId.trim().toLowerCase();
  for (let i = 0; i < users.length; i = i + 1) {
    if (users[i].membershipId.toLowerCase() === wanted && users[i].id !== ignoreId) {
      return true;
    }
  }

  return false;
}
